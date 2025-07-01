// agentUtils.js - Node.js CommonJS version for backend (no TypeScript imports)
// This file provides backend utility functions for the marketing agent.

/**
 * Create a business paragraph from onboarding data (object with business info fields)
 * @param {Object} onboardingData
 * @returns {string}
 */
function createBusinessParagraphFromData(onboardingData) {
  if (!onboardingData) return "";
  // Example: concatenate all values for a summary
  return Object.values(onboardingData).join(". ");
}

/**
 * Save onboarding paragraph for a user
 * @param {string} paragraph
 * @param {string} userId
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<any>}
 */
async function saveOnboardingParagraph(paragraph, userId, supabase) {
  if (!paragraph || !userId) throw new Error("Missing paragraph or userId");
  const { data, error } = await supabase
    .from("onboarding")
    .insert([{ user_id: userId, paragraph }]);
  if (error) throw error;
  return data;
}

/**
 * Create a campaign for a user
 * @param {Object} args
 * @param {string} userId
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<any>}
 */
async function createCampaign(args, userId, supabase) {
  if (!userId) throw new Error("Missing userId");
  const { data, error } = await supabase
    .from("campaigns")
    .insert([{ ...args, user_id: userId }])
    .select();
  if (error) throw error;
  return data?.[0] || null;
}

/**
 * Create a schedule for a user
 * @param {Object} args
 * @param {string} userId
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<any>}
 */
async function createSchedule(args, userId, supabase) {
  if (!userId) throw new Error("Missing userId");
  const { data, error } = await supabase
    .from("schedule")
    .insert([{ ...args, user_id: userId }])
    .select();
  if (error) throw error;
  return data?.[0] || null;
}

/**
 * Get all campaigns for a user
 * @param {string} userId
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<any[]>}
 */
async function getCampaigns(userId, supabase) {
  if (!userId) throw new Error("Missing userId");
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Get schedule for a campaign (or all schedules for a user if campaign_id not provided)
 * @param {string} userId
 * @param {string} [campaignId]
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<any[]>}
 */
async function getSchedule(userId, campaignId, supabase) {
  if (!userId) throw new Error("Missing userId");
  let query = supabase
    .from("schedule")
    .select("*")
    .eq("user_id", userId);
  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }
  const { data, error } = await query.order("scheduled_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

module.exports = {
  createBusinessParagraphFromData,
  saveOnboardingParagraph,
  createCampaign,
  createSchedule,
  getCampaigns,
  getSchedule,
};
