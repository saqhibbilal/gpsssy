import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set title and meta description for SEO
document.title = "TrackPro - Real-time GPS Event Tracking System";
const metaDescription = document.createElement("meta");
metaDescription.name = "description";
metaDescription.content = "Professional real-time GPS tracking system for sports and adventure events. Monitor participants, create routes, and manage events with our advanced tracking technology.";
document.head.appendChild(metaDescription);

// Add Open Graph meta tags for better social media sharing
const ogTags = [
  { property: "og:title", content: "TrackPro - Real-time GPS Event Tracking System" },
  { property: "og:description", content: "Monitor participants in real-time with our professional GPS tracking system for sports and adventure events." },
  { property: "og:type", content: "website" },
  { property: "og:url", content: window.location.href },
];

ogTags.forEach(tag => {
  const meta = document.createElement("meta");
  meta.setAttribute("property", tag.property);
  meta.setAttribute("content", tag.content);
  document.head.appendChild(meta);
});

// Add favicon link
const favicon = document.createElement("link");
favicon.rel = "icon";
favicon.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231E88E5'><path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/></svg>";
document.head.appendChild(favicon);

createRoot(document.getElementById("root")!).render(<App />);
