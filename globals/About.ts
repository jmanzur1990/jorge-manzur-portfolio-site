import type { GlobalConfig } from "payload";

export const About: GlobalConfig = {
  slug: "about",
  fields: [
    {
      name: "paragraphs",
      type: "array",
      fields: [
        {
          name: "text",
          type: "textarea",
          required: true,
        },
      ],
    },
    {
      name: "nowPlaying",
      type: "text",
    },
    {
      name: "nowReading",
      type: "text",
    },
    {
      name: "nowBuilding",
      type: "text",
    },
  ],
};
