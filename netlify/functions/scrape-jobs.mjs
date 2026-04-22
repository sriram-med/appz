// Netlify Function (Node) scraper example.
// Use this for scheduled ingestion; alternatively trigger via GitHub Action.

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function inferState(text = '') {
  const states = [
    'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Kerala', 'Uttar Pradesh', 'Madhya Pradesh',
    'Rajasthan', 'Gujarat', 'Delhi', 'Punjab', 'Bihar', 'Odisha', 'West Bengal', 'Telangana',
  ];
  const hit = states.find((s) => text.toLowerCase().includes(s.toLowerCase()));
  return hit || 'All India';
}

async function scrapeFreeJobAlertMbbs() {
  const url = 'https://www.freejobalert.com/mbbs-jobs/';
  const html = await fetch(url).then((r) => r.text());
  const $ = cheerio.load(html);
  const jobs = [];

  $('a').each((_, el) => {
    const title = $(el).text().replace(/\s+/g, ' ').trim();
    const href = $(el).attr('href');
    if (!title || !href) return;
    if (!/medical|mbbs|doctor/i.test(title)) return;
    const contextText = $(el).closest('tr, li, div').text();

    jobs.push({
      title,
      state: inferState(contextText),
      is_central: /aiims|railway|esic|central|union/i.test(contextText),
      location: inferState(contextText),
      description: contextText.slice(0, 500),
      last_date: null, // parse if structured date is available from source page
      source_url: href.startsWith('http') ? href : new URL(href, url).toString(),
      posted_at: new Date().toISOString(),
      scraped_at: new Date().toISOString(),
    });
  });

  return jobs;
}

export default async (req, context) => {
  // Optional shared-secret guard when exposing this endpoint publicly.
  const expectedToken = process.env.SCRAPER_BEARER_TOKEN;
  const auth = req.headers.get('authorization') || '';
  if (expectedToken && auth !== `Bearer ${expectedToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const jobs = await scrapeFreeJobAlertMbbs();

  const deduped = Array.from(new Map(jobs.map((j) => [`${j.title}|${j.last_date}|${j.state}`, j])).values());

  const { error } = await supabase
    .from('jobs')
    .upsert(deduped, { onConflict: 'title,last_date,state' });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(
    JSON.stringify({ ok: true, inserted_or_updated: deduped.length, scraped_at: new Date().toISOString() }),
    { status: 200 },
  );
};
