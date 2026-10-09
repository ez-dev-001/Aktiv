import { createClient } from '@sanity/client'
import fs from 'node:fs'
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')).trim(), l.slice(l.indexOf('=')+1).trim()]))
const c = createClient({ projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: env.NEXT_PUBLIC_SANITY_DATASET, apiVersion: '2026-01-01', useCdn: false, token: env.SANITY_API_READ_TOKEN })
const r = await c.fetch(`{"home": *[_id=="homePage"][0]{..., "drafts": null}, "draftHome": *[_id=="drafts.homePage"][0]._id, "about": *[_type=="aboutPage"][0]{mission, _id}, "trust": *[_type=="siteSettings"][0]{trustEyebrow, trustHeading, trustText, trustFacts, figures, _id}, "contacts": *[_type=="siteSettings"][0]{leadTitle, leadText} }`)
fs.writeFileSync(process.env.HOME + '/mnt/Шайко - сайт/.sanity-dump.json', JSON.stringify(r, null, 1))
console.log('ok', Object.keys(r.home||{}).length)
