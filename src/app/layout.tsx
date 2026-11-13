import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
};

export const metadata: Metadata = {
  title: "Anfio | Attendance & Team Management",
  description:
    "Production-ready Employee Attendance, Leave, Late Report, and Team Management System.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 1. Create a dummy hidden marker so the Netlify HUD script bails out immediately
                  if (!document.getElementById("nl-badge-frame")) {
                    var d = document.createElement("div");
                    d.id = "nl-badge-frame";
                    d.style.cssText = "display:none!important;visibility:hidden!important;width:0!important;height:0!important;position:fixed!important;top:-99999px!important;";
                    if (document.documentElement) {
                      document.documentElement.appendChild(d);
                    }
                  }
                  // 2. Pre-populate Netlify HUD dismissal state in localStorage
                  var future = Date.now() + 600000000;
                  localStorage.setItem("nl-hud:public:v1", "hidden:" + future);
                  localStorage.setItem("nl-hud:owner-private:v1", "hidden");
                } catch (e) {}

                // 3. Neutralize any Netlify HUD script or iframe if appended
                var neutralize = function(node) {
                  if (!node || node.nodeType !== 1) return;
                  if (node.tagName === "SCRIPT" && (node.src && node.src.indexOf("/.netlify/scripts/hud") !== -1 || node.hasAttribute("data-nf-variant"))) {
                    node.removeAttribute("data-nf-variant");
                    if (node.dataset) {
                      delete node.dataset.nfVariant;
                      node.dataset.accountTier = "pro";
                    }
                  }
                  if (node.tagName === "IFRAME" && (node.id === "nl-badge-frame" || (node.id && node.id.indexOf("nl-") === 0) || node.hasAttribute("data-nl-ready"))) {
                    node.remove();
                  }
                };

                var obs = new MutationObserver(function(mutations) {
                  for (var i = 0; i < mutations.length; i++) {
                    var added = mutations[i].addedNodes;
                    for (var j = 0; j < added.length; j++) {
                      neutralize(added[j]);
                    }
                  }
                });
                obs.observe(document.documentElement, { childList: true, subtree: true });
              })();
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #nl-badge-frame,
              iframe#nl-badge-frame,
              iframe[data-nl-ready],
              iframe[id^="nl-"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                width: 0 !important;
                height: 0 !important;
                position: fixed !important;
                top: -99999px !important;
                left: -99999px !important;
                clip: rect(0, 0, 0, 0) !important;
                z-index: -999999 !important;
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
