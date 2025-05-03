import {Client} from '@notionhq/client'

async function addToNotionPage(accessToken, pageTitle, contentToAdd) {
  const notion = new Client({ auth: accessToken });
  // Step 1: Search page
  const res = await notion.search({ query: pageTitle, filter: { value: "page", property: "object" } });
  if (!res.results.length) return `Page "${pageTitle}" not found.`;
  const pageId = res.results[0].id;
  // Step 2: Append block children
  await notion.blocks.children.append({
    block_id: pageId,
    children: [{ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: contentToAdd } }] } }]
  });
  return `Added to page "${pageTitle}".`;
}

const response = await addToNotionPage("" , "BBA" , "millie se message hai")
console.log(response)
