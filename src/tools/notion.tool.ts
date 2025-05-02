import {Client} from '@notionhq/client'

// Initializing a client
const notion = new Client({
  auth: "",
});



(async () => {
  const response = await notion.pages.create({
    "cover": {
        "type": "external",
        "external": {
            "url": "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg"
        }
    },
    "icon": {
        "type": "emoji",
        "emoji": "🥬"
    },
    "parent": {
        "type": "database_id",
        "database_id": "30bf0400af01431ca9d402e1c171f902"
    },
    "properties": {
        "Name": {
            "title": [
                {
                    "text": {
                        "content": "Tuscan kale"
                    }
                }
            ]
        },
        "Description": {
            "rich_text": [
                {
                    "text": {
                        "content": "A dark green leafy vegetable"
                    }
                }
            ]
        },
        "Food group": {
            "select": {
                "name": "🥬 Vegetable"
            }
        }
    },
    "children": [
        {
            "object": "block",
            "heading_2": {
                "rich_text": [
                    {
                        "text": {
                            "content": "Lacinato kale"
                        }
                    }
                ]
            }
        },
        {
            "object": "block",
            "paragraph": {
                "rich_text": [
                    {
                        "text": {
                            "content": "Lacinato kale is a variety of kale with a long tradition in Italian cuisine, especially that of Tuscany. It is also known as Tuscan kale, Italian kale, dinosaur kale, kale, flat back kale, palm tree kale, or black Tuscan palm.",
                            "link": {
                                "url": "https://en.wikipedia.org/wiki/Lacinato_kale"
                            }
                        },
                    }
                ],
                "color": "default"
            }
        }
    ]
});
  console.log(response);
})();