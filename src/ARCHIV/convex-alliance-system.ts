// ============================================================
// CONVEX ALIAČNÍ SYSTÉM - POKROČILÁ LOGIKA PRO SPRÁVU ALIANCÍ
// ============================================================

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import {
  Alliance,
  Player,
  Province,
  ApiResponse,
  ALLIANCE_COLORS
} from '../types/game-types';

// ============================================================
// TYPY PRO ALIAČNÍ SYSTÉM
// ============================================================

export interface AllianceInvitation {
  id: string;
  allianceId: string;
  playerId: string;
  invitedBy: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface AllianceRelation {
  id: string;
  alliance1Id: string;
  alliance2Id: string;
  relationType: 'neutral' | 'ally' | 'enemy' | 'trade' | 'non_aggression';
  establishedBy: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface AllianceStats {
  allianceId: string;
  memberCount: number;
  totalWealth: number;
  totalProvinces: number;
  totalTerritories: number;
  averagePlayerLevel: number;
  militaryStrength: number;
  economicPower: number;
  ranking: number;
}

export interface AlliancePermissions {
  canInviteMembers: boolean;
  canKickMembers: boolean;
  canManageDiplomacy: boolean;
  canManageRanks: boolean;
  canAccessTreasury: boolean;
  canDeclareWar: boolean;
}

export const ALLIANCE_ROLES = {
  LEADER: 'leader',
  OFFICER: 'officer', 
  MEMBER: 'member',
  RECRUIT: 'recruit'
} as const;

export type AllianceRole = typeof ALLIANCE_ROLES[keyof typeof ALLIANCE_ROLES];

export const ROLE_PERMISSIONS: Record<AllianceRole, AlliancePermissions> = {
  [ALLIANCE_ROLES.LEADER]: {
    canInviteMembers: true,
    canKickMembers: true,
    canManageDiplomacy: true,
    canManageRanks: true,
    canAccessTreasury: true,
    canDeclareWar: true
  },
  [ALLIANCE_ROLES.OFFICER]: {
    canInviteMembers: true,
    canKickMembers: true,
    canManageDiplomacy: false,
    canManageRanks: false,
    canAccessTreasury: false,
    canDeclareWar: false
  },
  [ALLIANCE_ROLES.MEMBER]: {
    canInviteMembers: false,
    canKickMembers: false,
    canManageDiplomacy: false,
    canManageRanks: false,
    canAccessTreasury: false,
    canDeclareWar: false
  },
  [ALLIANCE_ROLES.RECRUIT]: {
    canInviteMembers: false,
    canKickMembers: false,
    canManageDiplomacy: false,
    canManageRanks: false,
    canAccessTreasury: false,
    canDeclareWar: false
  }
};

// ============================================================
// MUTATIONS PRO SPRÁVU ALIANCÍ
// ============================================================

// Rozpuštění aliance
export const disbandAlliance = mutation({
  args: {
    allianceId: v.id("alliances"),
    playerId: v.id("players")
  },
  handler: async (ctx, { allianceId, playerId }) => {
    try {
      // Ověř, že hráč je leader aliance
      const alliance = await ctx.db.get(allianceId);
      if (!alliance) {
        return { success: false, error: 'Aliance nenalezena' };
      }

      if (alliance.leader_id !== playerId) {
        return { success: false, error: 'Pouze leader může rozpustit alianci' };
      }

      // Získej všechny členy
      const members = await ctx.db
        .query("alliance_members")
        .withIndex("by_alliance", (q) => q.eq("alliance_id", allianceId))
        .collect();

      // Odstraň všechny členy z aliance
      for (const member of members) {
        await ctx.db.delete(member._id);
        
        // Aktualizuj hráče
        await ctx.db.patch(member.player_id, {
          alliance_id: undefined,
          color: ALLIANCE_COLORS[0] // Default barva
        });
      }

      // Aktualizuj provincie aby neměly alianci
      const provinces = await ctx.db
        .query("provinces")
        .withIndex("by_alliance", (q) => q.eq("alliance_id", allianceId))
        .collect();

      for (const province of provinces) {
        const owner = await ctx.db.get(province.owner_id);
        await ctx.db.patch(province._id, {
          alliance_id: undefined,
          color: owner?.color || ALLIANCE_COLORS[0]
        });
      }

      // Smaž alianci
      await ctx.db.delete(allianceId);

      // Pošli notifikaci všem bývalým členům
      await ctx.runMutation(api.convex_alliance_system.notifyAllianceMembers, {
        memberIds: members.map(m => m.player_id),
        message: `Aliance "${alliance.name}" byla rozpuštěna`,
        type: 'warning'
      });

      return {
        success: true,
        data: true,
        message: 'Aliance byla rozpuštěna'
      };
    } catch (error) {
      console.error('Error disbanding alliance:', error);
      return { success: false, error: 'Chyba při rozpouštění aliance' };
    }
  },
});

// ============================================================
// SYSTÉM POZVÁNEK
// ============================================================

// Pozvání hráče do aliance
export const invitePlayer = mutation({
  args: {
    allianceId: v.id("alliances"),
    inviterId: v.id("players"),
    targetPlayerId: v.id("players"),
    message: v.optional(v.string())
  },
  handler: async (ctx, { allianceId, inviterId, targetPlayerId, message }) => {
    try {
      // Ověř oprávnění
      const hasPermission = await checkPermission(ctx, inviterId, allianceId, 'canInviteMembers');
      if (!hasPermission.success || !hasPermission.data) {
        return { success: false, error: 'Nemáte oprávnění zvát hráče' };
      }

      // Ověř, že cílový hráč není v alianci
      const target = await ctx.db.get(targetPlayerId);
      if (!target) {
        return { success: false, error: 'Hráč nenalezen' };
      }

      if (target.alliance_id) {
        return { success: false, error: 'Hráč je již členem aliance' };
      }

      // Zkontroluj existující pozvánky
      const existingInvitation = await ctx.db
        .query("alliance_invitations")
        .withIndex("by_alliance_and_player", (q) => 
          q.eq("alliance_id", allianceId).eq("player_id", targetPlayerId)
        )
        .filter((q) => q.eq(q.field("status"), "pending"))
        .first();

      if (existingInvitation) {
        return { success: false, error: 'Hráč již má aktivní pozvánku' };
      }

      // Vytvoř pozvánku
      const invitationId = await ctx.db.insert("alliance_invitations", {
        alliance_id: allianceId,
        player_id: targetPlayerId,
        invited_by: inviterId,
        message,
        status: "pending",
        expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dní
      });

      // Pošli notifikaci cílovému hráči
      await ctx.db.insert("notifications", {
        player_id: targetPlayerId,
        type: "alliance",
        title: "Pozvánka do aliance",
        message: message || "Byli jste pozváni do aliance",
        data: JSON.stringify({ invitationId, allianceId }),
        read: false,
        expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000)
      });

      return {
        success: true,
        data: { invitationId },
        message: 'Pozvánka byla odeslána'
      };
    } catch (error) {
      console.error('Error inviting player:', error);
      return { success: false, error: 'Chyba při odesílání pozvánky' };
    }
  },
});

// Odpověď na pozvánku
export const respondToInvitation = mutation({
  args: {
    invitationId: v.id("alliance_invitations"),
    playerId: v.id("players"),
    response: v.union(v.literal("accept"), v.literal("decline"))
  },
  handler: async (ctx, { invitationId, playerId, response }) => {
    try {
      const invitation = await ctx.db.get(invitationId);
      
      if (!invitation) {
        return { success: false, error: 'Pozvánka nenalezena' };
      }

      if (invitation.player_id !== playerId) {
        return { success: false, error: 'Nemáte oprávnění odpovědět na tuto pozvánku' };
      }

      if (invitation.status !== "pending") {
        return { success: false, error: 'Pozvánka už není aktivní' };
      }

      if (invitation.expires_at < Date.now()) {
        await ctx.db.patch(invitationId, { status: "expired" });
        return { success: false, error: 'Pozvánka vypršela' };
      }

      if (response === "accept") {
        // Připoj hráče k alianci
        const joinResult = await ctx.runMutation(api.convex_api.joinAlliance, {
          playerId,
          allianceId: invitation.alliance_id
        });

        if (!joinResult.success) {
          return joinResult;
        }

        await ctx.db.patch(invitationId, { status: "accepted" });

        return {
          success: true,
          data: true,
          message: 'Úspěšně jste se připojili k alianci!'
        };
      } else {
        await ctx.db.patch(invitationId, { status: "declined" });

        return {
          success: true,
          data: true,
          message: 'Pozvánka byla odmítnuta'
        };
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      return { success: false, error: 'Chyba při odpovídání na pozvánku' };
    }
  },
});

// ============================================================
// SPRÁVA ČLENŮ A ROLÍ
// ============================================================

// Vyhození hráče z aliance
export const kickPlayer = mutation({
  args: {
    allianceId: v.id("alliances"),
    kickerId: v.id("players"),
    targetPlayerId: v.id("players")
  },
  handler: async (ctx, { allianceId, kickerId, targetPlayerId }) => {
    try {
      // Ověř oprávnění
      const hasPermission = await checkPermission(ctx, kickerId, allianceId, 'canKickMembers');
      if (!hasPermission.success || !hasPermission.data) {
        return { success: false, error: 'Nemáte oprávnění vyhodit členy' };
      }

      // Ověř, že se hráč nesnaží vyhodit sám sebe nebo leadera
      const alliance = await ctx.db.get(allianceId);
      if (!alliance) {
        return { success: false, error: 'Aliance nenalezena' };
      }

      if (targetPlayerId === alliance.leader_id) {
        return { success: false, error: 'Nelze vyhodit leadera aliance' };
      }

      if (targetPlayerId === kickerId) {
        return { success: false, error: 'Nemůžete vyhodit sami sebe' };
      }

      // Najdi členství
      const membership = await ctx.db
        .query("alliance_members")
        .withIndex("by_alliance_and_player", (q) => 
          q.eq("alliance_id", allianceId).eq("player_id", targetPlayerId)
        )
        .first();

      if (!membership) {
        return { success: false, error: 'Hráč není členem této aliance' };
      }

      // Odstraň člena
      await ctx.db.delete(membership._id);

      // Aktualizuj hráče
      await ctx.db.patch(targetPlayerId, {
        alliance_id: undefined,
        color: ALLIANCE_COLORS[0]
      });

      // Aktualizuj provincie hráče
      const provinces = await ctx.db
        .query("provinces")
        .withIndex("by_owner", (q) => q.eq("owner_id", targetPlayerId))
        .collect();

      for (const province of provinces) {
        await ctx.db.patch(province._id, {
          alliance_id: undefined,
          color: ALLIANCE_COLORS[0]
        });
      }

      // Pošli notifikaci vyhozenému hráči
      await ctx.db.insert("notifications", {
        player_id: targetPlayerId,
        type: "warning",
        title: "Vyhození z aliance",
        message: `Byli jste vyhozeni z aliance "${alliance.name}"`,
        read: false
      });

      return {
        success: true,
        data: true,
        message: 'Hráč byl vyhozen z aliance'
      };
    } catch (error) {
      console.error('Error kicking player:', error);
      return { success: false, error: 'Chyba při vyhazování hráče' };
    }
  },
});

// Povýšení/degradace hráče
export const changePlayerRole = mutation({
  args: {
    allianceId: v.id("alliances"),
    managerId: v.id("players"),
    targetPlayerId: v.id("players"),
    newRole: v.union(v.literal("leader"), v.literal("officer"), v.literal("member"), v.literal("recruit"))
  },
  handler: async (ctx, { allianceId, managerId, targetPlayerId, newRole }) => {
    try {
      // Ověř oprávnění
      const hasPermission = await checkPermission(ctx, managerId, allianceId, 'canManageRanks');
      if (!hasPermission.success || !hasPermission.data) {
        return { success: false, error: 'Nemáte oprávnění spravovat hodnosti' };
      }

      // Najdi členství
      const membership = await ctx.db
        .query("alliance_members")
        .withIndex("by_alliance_and_player", (q) => 
          q.eq("alliance_id", allianceId).eq("player_id", targetPlayerId)
        )
        .first();

      if (!membership) {
        return { success: false, error: 'Hráč není členem této aliance' };
      }

      // Speciální kontrola pro leader role
      if (newRole === "leader") {
        const alliance = await ctx.db.get(allianceId);
        if (alliance?.leader_id !== managerId) {
          return { success: false, error: 'Pouze současný leader může předat vedení' };
        }

        // Změň leadera aliance
        await ctx.db.patch(allianceId, { leader_id: targetPlayerId });

        // Degraduj současného leadera na officer
        const currentLeaderMembership = await ctx.db
          .query("alliance_members")
          .withIndex("by_alliance_and_player", (q) => 
            q.eq("alliance_id", allianceId).eq("player_id", managerId)
          )
          .first();

        if (currentLeaderMembership) {
          await ctx.db.patch(currentLeaderMembership._id, { role: "officer" });
        }
      }

      // Aktualizuj roli
      await ctx.db.patch(membership._id, { role: newRole });

      return {
        success: true,
        data: true,
        message: `Hráč byl ${newRole === "leader" ? "povýšen na leadera" : `změněn na ${newRole}`}`
      };
    } catch (error) {
      console.error('Error changing player role:', error);
      return { success: false, error: 'Chyba při změně role hráče' };
    }
  },
});

// ============================================================
// DIPLOMACIE
// ============================================================

// Navázání diplomatického vztahu
export const proposeDiplomaticRelation = mutation({
  args: {
    proposingAllianceId: v.id("alliances"),
    proposerId: v.id("players"),
    targetAllianceId: v.id("alliances"),
    relationType: v.union(v.literal("ally"), v.literal("trade"), v.literal("non_aggression"))
  },
  handler: async (ctx, { proposingAllianceId, proposerId, targetAllianceId, relationType }) => {
    try {
      // Ověř oprávnění
      const hasPermission = await checkPermission(ctx, proposerId, proposingAllianceId, 'canManageDiplomacy');
      if (!hasPermission.success || !hasPermission.data) {
        return { success: false, error: 'Nemáte oprávnění spravovat diplomacii' };
      }

      // Zkontroluj, že cílová aliance existuje
      const targetAlliance = await ctx.db.get(targetAllianceId);
      if (!targetAlliance) {
        return { success: false, error: 'Cílová aliance nenalezena' };
      }

      // Zkontroluj existující vztah
      const existingRelation = await ctx.db
        .query("alliance_relations")
        .withIndex("by_alliances", (q) => 
          q.eq("alliance1_id", proposingAllianceId).eq("alliance2_id", targetAllianceId)
        )
        .first();

      if (existingRelation) {
        return { success: false, error: 'Diplomatický vztah už existuje' };
      }

      // Vytvoř diplomatický vztah (čeká na potvrzení)
      const relationId = await ctx.db.insert("alliance_relations", {
        alliance1_id: proposingAllianceId,
        alliance2_id: targetAllianceId,
        relation_type: relationType,
        established_by: proposerId
      });

      // Pošli notifikaci leaderovi cílové aliance
      await ctx.db.insert("notifications", {
        player_id: targetAlliance.leader_id,
        type: "alliance",
        title: "Diplomatický návrh",
        message: `Aliance vám navrhuje ${relationType} vztah`,
        data: JSON.stringify({ relationId, proposingAllianceId }),
        read: false
      });

      return {
        success: true,
        data: { relationId },
        message: 'Diplomatický návrh byl odeslán'
      };
    } catch (error) {
      console.error('Error proposing diplomatic relation:', error);
      return { success: false, error: 'Chyba při navazování diplomatických vztahů' };
    }
  },
});

// Vyhlášení války
export const declareWar = mutation({
  args: {
    declaringAllianceId: v.id("alliances"),
    declarerId: v.id("players"),
    targetAllianceId: v.id("alliances")
  },
  handler: async (ctx, { declaringAllianceId, declarerId, targetAllianceId }) => {
    try {
      // Ověř oprávnění
      const hasPermission = await checkPermission(ctx, declarerId, declaringAllianceId, 'canDeclareWar');
      if (!hasPermission.success || !hasPermission.data) {
        return { success: false, error: 'Nemáte oprávnění vyhlašovat války' };
      }

      const [declaringAlliance, targetAlliance] = await Promise.all([
        ctx.db.get(declaringAllianceId),
        ctx.db.get(targetAllianceId)
      ]);

      if (!declaringAlliance || !targetAlliance) {
        return { success: false, error: 'Aliance nenalezena' };
      }

      // Vytvoř nepřátelský vztah
      await ctx.db.insert("alliance_relations", {
        alliance1_id: declaringAllianceId,
        alliance2_id: targetAllianceId,
        relation_type: "enemy",
        established_by: declarerId
      });

      // Protivztah
      await ctx.db.insert("alliance_relations", {
        alliance1_id: targetAllianceId,
        alliance2_id: declaringAllianceId,
        relation_type: "enemy",
        established_by: declarerId
      });

      // Notifikuj všechny členy obou aliancí
      const [declaringMembers, targetMembers] = await Promise.all([
        ctx.db.query("alliance_members")
          .withIndex("by_alliance", (q) => q.eq("alliance_id", declaringAllianceId))
          .collect(),
        ctx.db.query("alliance_members")
          .withIndex("by_alliance", (q) => q.eq("alliance_id", targetAllianceId))
          .collect()
      ]);

      await ctx.runMutation(api.convex_alliance_system.notifyAllianceMembers, {
        memberIds: declaringMembers.map(m => m.player_id),
        message: `Vaše aliance vyhlásila válku alianci "${targetAlliance.name}"!`,
        type: 'war'
      });

      await ctx.runMutation(api.convex_alliance_system.notifyAllianceMembers, {
        memberIds: targetMembers.map(m => m.player_id),
        message: `Aliance "${declaringAlliance.name}" vám vyhlásila válku!`,
        type: 'war'
      });

      return {
        success: true,
        data: true,
        message: 'Válka byla vyhlášena!'
      };
    } catch (error) {
      console.error('Error declaring war:', error);
      return { success: false, error: 'Chyba při vyhlašování války' };
    }
  },
});

// ============================================================
// STATISTIKY
// ============================================================

export const getAllianceStats = query({
  args: { allianceId: v.id("alliances") },
  handler: async (ctx, { allianceId }) => {
    try {
      const alliance = await ctx.db.get(allianceId);
      if (!alliance) {
        return { success: false, error: 'Aliance nenalezena' };
      }

      // Získej členy aliance
      const members = await ctx.db
        .query("alliance_members")
        .withIndex("by_alliance", (q) => q.eq("alliance_id", allianceId))
        .collect();

      // Získej hráče aliance
      const players = await Promise.all(
        members.map(m => ctx.db.get(m.player_id))
      );

      // Získej provincie aliance
      const provinces = await ctx.db
        .query("provinces")
        .withIndex("by_alliance", (q) => q.eq("alliance_id", allianceId))
        .collect();

      // Spočítej statistiky
      const totalWealth = players.reduce((sum, p) => sum + (p?.veny || 0), 0);
      const averageLevel = players.reduce((sum, p) => sum + (p?.level || 1), 0) / players.length;
      const totalPopulation = provinces.reduce((sum, p) => sum + p.population, 0);
      const totalResources = provinces.reduce((sum, p) => sum + p.resources, 0);

      const stats: AllianceStats = {
        allianceId,
        memberCount: members.length,
        totalWealth,
        totalProvinces: provinces.length,
        totalTerritories: 0, // TODO: spočítat políčka
        averagePlayerLevel: Math.round(averageLevel * 10) / 10,
        militaryStrength: 0, // TODO: spočítat jednotky
        economicPower: totalWealth + totalResources,
        ranking: 0 // TODO: implementovat ranking
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting alliance stats:', error);
      return { success: false, error: 'Chyba při načítání statistik aliance' };
    }
  },
});

// ============================================================
// HELPER FUNKCE
// ============================================================

// Kontrola oprávnění
async function checkPermission(
  ctx: any, 
  playerId: string, 
  allianceId: string, 
  permission: keyof AlliancePermissions
): Promise<{ success: boolean; data?: boolean; error?: string }> {
  try {
    const membership = await ctx.db
      .query("alliance_members")
      .withIndex("by_alliance_and_player", (q) => 
        q.eq("alliance_id", allianceId).eq("player_id", playerId)
      )
      .first();

    if (!membership) {
      return { success: false, error: 'Hráč není členem této aliance' };
    }

    const hasPermission = ROLE_PERMISSIONS[membership.role as AllianceRole][permission];
    
    return { success: true, data: hasPermission };
  } catch (error) {
    console.error('Error checking permission:', error);
    return { success: false, error: 'Chyba při kontrole oprávnění' };
  }
}

// Notifikace členů aliance
export const notifyAllianceMembers = mutation({
  args: {
    memberIds: v.array(v.id("players")),
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("warning"), v.literal("success"), v.literal("war"))
  },
  handler: async (ctx, { memberIds, message, type }) => {
    try {
      for (const memberId of memberIds) {
        await ctx.db.insert("notifications", {
          player_id: memberId,
          type,
          title: "Aliační zpráva",
          message,
          read: false
        });
      }
    } catch (error) {
      console.error('Error sending alliance notifications:', error);
    }
  },
});

// ============================================================
// QUERIES PRO FRONT-END
// ============================================================

export const getPlayerInvitations = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    try {
      const invitations = await ctx.db
        .query("alliance_invitations")
        .withIndex("by_player", (q) => q.eq("player_id", playerId))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .filter((q) => q.gt(q.field("expires_at"), Date.now()))
        .collect();

      // Přidej informace o aliancích
      const invitationsWithDetails = await Promise.all(
        invitations.map(async (inv) => {
          const alliance = await ctx.db.get(inv.alliance_id);
          const inviter = await ctx.db.get(inv.invited_by);
          
          return {
            ...inv,
            allianceName: alliance?.name,
            allianceColor: alliance?.color,
            inviterName: inviter?.name
          };
        })
      );

      return { success: true, data: invitationsWithDetails };
    } catch (error) {
      console.error('Error getting player invitations:', error);
      return { success: false, error: 'Chyba při načítání pozvánek' };
    }
  },
});

export const getAllianceRankings = query({
  args: {},
  handler: async (ctx) => {
    try {
      const alliances = await ctx.db.query("alliances").collect();
      
      // Pro každou alianci spočítej statistiky
      const allianceStats = await Promise.all(
        alliances.map(async (alliance) => {
          const statsResult = await ctx.runQuery(api.convex_alliance_system.getAllianceStats, {
            allianceId: alliance._id
          });
          
          return {
            ...alliance,
            stats: statsResult.data
          };
        })
      );

      // Seřaď podle ekonomické síly
      const rankings = allianceStats
        .filter(a => a.stats)
        .sort((a, b) => (b.stats?.economicPower || 0) - (a.stats?.economicPower || 0))
        .map((alliance, index) => ({
          ...alliance.stats,
          ranking: index + 1,
          name: alliance.name,
          color: alliance.color
        }));

      return { success: true, data: rankings };
    } catch (error) {
      console.error('Error getting alliance rankings:', error);
      return { success: false, error: 'Chyba při načítání žebříčku aliancí' };
    }
  },
});