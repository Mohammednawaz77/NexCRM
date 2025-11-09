import { users, leads, activities, type User, type InsertUser, type Lead, type InsertLead, type Activity, type InsertActivity, type LeadWithOwner, type ActivityWithUser, type LeadWithDetails } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lt } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  getAllLeads(userId?: number, role?: string): Promise<LeadWithOwner[]>;
  getLeadById(id: number): Promise<LeadWithDetails | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<void>;
  
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByLeadId(leadId: number): Promise<ActivityWithUser[]>;
  
  getStats(userId?: number, role?: string): Promise<{
    totalLeads: number;
    activeLeads: number;
    convertedLeads: number;
    totalValue: number;
    leadsByStatus: { status: string; count: number }[];
    leadsBySource: { source: string; count: number }[];
    recentActivity: { date: string; count: number }[];
  }>;
  
  getAnalytics(userId?: number, role?: string): Promise<{
    conversionRate: number;
    avgDealSize: number;
    avgTimeToClose: number;
    leadTrend: { month: string; leads: number; won: number }[];
    performanceByUser: { user: string; leads: number; won: number; value: number }[];
    statusDistribution: { status: string; count: number; percentage: number }[];
  }>;
  
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllLeads(userId?: number, role?: string): Promise<LeadWithOwner[]> {
    const query = db
      .select({
        id: leads.id,
        companyName: leads.companyName,
        contactName: leads.contactName,
        email: leads.email,
        phone: leads.phone,
        status: leads.status,
        source: leads.source,
        value: leads.value,
        ownerId: leads.ownerId,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
        owner: users,
      })
      .from(leads)
      .leftJoin(users, eq(leads.ownerId, users.id))
      .orderBy(desc(leads.createdAt));

    if (role === "sales_executive" && userId) {
      return await query.where(eq(leads.ownerId, userId)) as any;
    }

    return await query as any;
  }

  async getLeadById(id: number): Promise<LeadWithDetails | undefined> {
    const [lead] = await db
      .select({
        id: leads.id,
        companyName: leads.companyName,
        contactName: leads.contactName,
        email: leads.email,
        phone: leads.phone,
        status: leads.status,
        source: leads.source,
        value: leads.value,
        ownerId: leads.ownerId,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
        owner: users,
      })
      .from(leads)
      .leftJoin(users, eq(leads.ownerId, users.id))
      .where(eq(leads.id, id));

    if (!lead) return undefined;

    const leadActivities = await db
      .select({
        id: activities.id,
        leadId: activities.leadId,
        userId: activities.userId,
        type: activities.type,
        subject: activities.subject,
        notes: activities.notes,
        createdAt: activities.createdAt,
        user: users,
      })
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .where(eq(activities.leadId, id))
      .orderBy(desc(activities.createdAt));

    return {
      ...lead,
      activities: leadActivities as any,
    } as any;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values(insertLead)
      .returning();
    return lead;
  }

  async updateLead(id: number, updateData: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db
      .update(leads)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead || undefined;
  }

  async deleteLead(id: number): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getActivitiesByLeadId(leadId: number): Promise<ActivityWithUser[]> {
    const results = await db
      .select({
        id: activities.id,
        leadId: activities.leadId,
        userId: activities.userId,
        type: activities.type,
        subject: activities.subject,
        notes: activities.notes,
        createdAt: activities.createdAt,
        user: users,
      })
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .where(eq(activities.leadId, leadId))
      .orderBy(desc(activities.createdAt));

    return results as any;
  }

  async getStats(userId?: number, role?: string) {
    let leadsQuery = db.select().from(leads);
    
    if (role === "sales_executive" && userId) {
      leadsQuery = leadsQuery.where(eq(leads.ownerId, userId)) as any;
    }

    const allLeads = await leadsQuery;

    const totalLeads = allLeads.length;
    const activeLeads = allLeads.filter(l => !['won', 'lost'].includes(l.status)).length;
    const convertedLeads = allLeads.filter(l => l.status === 'won').length;
    const totalValue = allLeads.reduce((sum, l) => sum + (l.value || 0), 0);

    const statusCounts = allLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const leadsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    const sourceCounts = allLeads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const leadsBySource = Object.entries(sourceCounts).map(([source, count]) => ({
      source,
      count,
    }));

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    let activitiesQuery = db.select().from(activities);
    const allActivities = await activitiesQuery;

    const recentActivity = last7Days.map(date => {
      const count = allActivities.filter(a => 
        a.createdAt.toISOString().split('T')[0] === date
      ).length;
      return { date, count };
    });

    return {
      totalLeads,
      activeLeads,
      convertedLeads,
      totalValue,
      leadsByStatus,
      leadsBySource,
      recentActivity,
    };
  }

  async getAnalytics(userId?: number, role?: string) {
    let leadsQuery = db.select().from(leads);
    
    if (role === "sales_executive" && userId) {
      leadsQuery = leadsQuery.where(eq(leads.ownerId, userId)) as any;
    }

    const allLeads = await leadsQuery;
    const wonLeads = allLeads.filter(l => l.status === 'won');
    const totalLeads = allLeads.length;

    const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
    const avgDealSize = wonLeads.length > 0 
      ? wonLeads.reduce((sum, l) => sum + (l.value || 0), 0) / wonLeads.length 
      : 0;

    const timesToClose = wonLeads.map(l => {
      const created = new Date(l.createdAt);
      const updated = new Date(l.updatedAt);
      return (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    });
    const avgTimeToClose = timesToClose.length > 0
      ? timesToClose.reduce((sum, t) => sum + t, 0) / timesToClose.length
      : 0;

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return date.toISOString().substring(0, 7);
    });

    const leadTrend = last6Months.map(month => {
      const monthLeads = allLeads.filter(l => 
        l.createdAt.toISOString().substring(0, 7) === month
      );
      const monthWon = monthLeads.filter(l => l.status === 'won');
      return {
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        leads: monthLeads.length,
        won: monthWon.length,
      };
    });

    const allUsers = await db.select().from(users);
    const performanceByUser = allUsers.map(user => {
      const userLeads = allLeads.filter(l => l.ownerId === user.id);
      const userWon = userLeads.filter(l => l.status === 'won');
      const userValue = userWon.reduce((sum, l) => sum + (l.value || 0), 0);
      return {
        user: user.fullName,
        leads: userLeads.length,
        won: userWon.length,
        value: userValue,
      };
    }).filter(p => p.leads > 0);

    const statusCounts = allLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: totalLeads > 0 ? (count / totalLeads) * 100 : 0,
    }));

    return {
      conversionRate,
      avgDealSize,
      avgTimeToClose,
      leadTrend,
      performanceByUser,
      statusDistribution,
    };
  }
}

export const storage = new DatabaseStorage();
