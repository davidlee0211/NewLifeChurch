import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://modoosunday.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/student/", "/super-admin/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
