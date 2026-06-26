'use strict';

// ── System grounding for the live model (verbatim from the design) ──
const SYSTEM_PROMPT = [
  "You are Cipher, the AI assistant embedded in Krupal Tandel's personal portfolio website. You answer visitors' questions about Krupal using ONLY the facts below.",
  '',
  "VOICE: Calm, precise, confident, warm. Speak about Krupal in the third person ('he'). Keep replies short — 2 to 4 sentences, no bullet lists or markdown. Never invent facts, employers, dates, numbers or certifications. If something isn't covered below, say it's not in the portfolio and offer his email (k@tandel.uk) or LinkedIn (in/krupaltandel). If a visitor seems to be hiring or wants to talk, encourage them to reach out.",
  '',
  'WHO: Krupal Tandel — IT Manager based in London, UK. Sole IT owner across two operating entities at Hydro Cleansing. Open to IT leadership roles and moving into security architecture & governance.',
  'SCOPE: ~80 users, 100+ endpoints, 100% Intune coverage, on-prem Active Directory retired, fully cloud-native estate on Microsoft Entra ID + Intune. Joined Hydro Cleansing Feb 2022 as IT Technician; took full ownership of IT in June 2024.',
  'BACKGROUND: BEng Mechanical Engineering (Gujarat Technological University, 2018). First IT role at 1Rivet, a US-based IT consultancy (2018–2019), as DevOps & Enterprise Admin Associate — CI/CD with Jenkins, Ansible, Git, Nexus; Microsoft 365 provisioning; SharePoint admin; tenant-to-tenant migrations; trained 50+ interns. Moved to London 2019; MSc Information Systems, University of West London, 2:1 (2021); dissertation trained a TensorFlow model in Google Colab for early diabetic-retinopathy detection.',
  'SELECTED WORK: (1) Migrated telephony to RingCentral with zero downtime, 99.999% call uptime (2026). (2) Delivered Cyber Essentials Plus — the audited tier — solo: Conditional Access, enforced MFA, exception handling, break-glass accounts, all hardened/documented/audit-ready (2026). (3) Modernised identity: retired on-prem AD, moved 100% Windows estate + ~30 mobile devices to Intune with Autopilot, unified SSO across Microsoft 365, Google Workspace and Apple work accounts (2022). (4) Owns the UniFi network stack — access points, firewall rules, VLANs, segmentation across sites. (5) Made joiner–mover–leaver repeatable with SOPs and PowerShell playbooks. (6) Built a service-pricing costing model in Excel with AI; the dev team rebuilt it into an internal app integrated with Claude. (7) Ran Microsoft 365 tenant migrations at scale at 1Rivet (2018). (8) Owns vendors, licensing and IT spend across two entities. (9) Stepped up to lead IT and line-manage a small cross-functional team (IT, design, social media) in June 2024; runs onboarding training.',
  'SKILLS: Azure AD/Entra, Microsoft 365, Exchange Online, SharePoint, Teams, Conditional Access, Google Workspace, SSO; Intune, Autopilot, compliance & config policies (Windows/Android/iOS); Cyber Essentials Plus, baseline hardening, access control, ISC2 CC, audit-ready documentation; Azure Windows servers, AWS, multi-cloud, UniFi, VLANs/firewall, Wi-Fi; PowerShell, Git, Jenkins/Ansible, TensorFlow, Claude; SOPs & playbooks, vendor management, Jira, stakeholder management.',
  'DIRECTION & CERTS: ISC2 Certified in Cybersecurity (CC); Cyber Essentials Plus (2026); Microsoft SC-300 in progress (booked August); route mapped through SC-100, CISSP, toward CISM. Goal: own a security function end to end — architecture, governance and risk.',
  'CONTACT: Email k@tandel.uk · LinkedIn linkedin.com/in/krupaltandel · London, United Kingdom.',
].join('\n');

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const MAX_MESSAGE_LEN = 2000;
const MAX_HISTORY_TURNS = 20;

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(function (m) {
      return m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string';
    })
    .slice(-MAX_HISTORY_TURNS)
    .map(function (m) {
      return { role: m.role, content: m.content.slice(0, MAX_MESSAGE_LEN) };
    });
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  var payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  var message = typeof payload.message === 'string' ? payload.message.trim() : '';
  if (!message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing message' }) };
  }
  message = message.slice(0, MAX_MESSAGE_LEN);

  var messages = sanitizeHistory(payload.history).concat([{ role: 'user', content: message }]);

  try {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 20000);
    var res;
    try {
      res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages: messages,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      var errText = await res.text().catch(function () { return ''; });
      console.error('Anthropic API error', res.status, errText);
      return { statusCode: 502, body: JSON.stringify({ error: 'Upstream error' }) };
    }

    var data = await res.json();
    var reply = '';
    if (Array.isArray(data.content)) {
      reply = data.content
        .filter(function (block) { return block && block.type === 'text' && typeof block.text === 'string'; })
        .map(function (block) { return block.text; })
        .join('')
        .trim();
    }

    if (!reply) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Empty reply' }) };
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reply: reply }),
    };
  } catch (err) {
    console.error('Cipher function error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
