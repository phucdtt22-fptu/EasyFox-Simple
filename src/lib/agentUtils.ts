// Create a business paragraph from onboarding data (stub)
import type { OnboardingFormData } from "@/types";
export function createBusinessParagraphFromData(onboardingData: OnboardingFormData): string {
  if (!onboardingData) return "";
  // Example: concatenate fields for demo
  return Object.values(onboardingData).join(". ");
}
import { SupabaseClient } from "@supabase/supabase-js";

// Save onboarding paragraph for a user
export async function saveOnboardingParagraph(paragraph: string, userId: string, supabase: SupabaseClient) {
  if (!paragraph || !userId) throw new Error("Missing paragraph or userId");
  const { data, error } = await supabase
    .from("onboarding")
    .insert([{ user_id: userId, paragraph }]);
  if (error) throw error;
  return data;
}

// Create a campaign for a user
import type { Campaign } from "@/types";
export async function createCampaign(args: Partial<Campaign>, userId: string, supabase: SupabaseClient) {
  if (!userId) throw new Error("Missing userId");
  const { data, error } = await supabase
    .from("campaigns")
    .insert([{ ...args, user_id: userId }])
    .select();
  if (error) throw error;
  return data?.[0] || null;
}

// Create a schedule for a user
import type { ScheduleItem } from "@/types";
export async function createSchedule(args: Partial<ScheduleItem>, userId: string, supabase: SupabaseClient) {
  if (!userId) throw new Error("Missing userId");
  const { data, error } = await supabase
    .from("schedule")
    .insert([{ ...args, user_id: userId }])
    .select();
  if (error) throw error;
  return data?.[0] || null;
}

// Get campaigns for a user
export async function getCampaigns(userId: string, supabase: SupabaseClient) {
  if (!userId) throw new Error("Missing userId");
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}

// Get schedule for a campaign
export async function getSchedule(userId: string, campaignId: string, supabase: SupabaseClient) {
  if (!userId || !campaignId) throw new Error("Missing userId or campaignId");
  const { data, error } = await supabase
    .from("schedule")
    .select("*")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId);
  if (error) throw error;
  return data;
}
