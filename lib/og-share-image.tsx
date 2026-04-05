import { ImageResponse } from "next/og";
import { PUREGYM_LOGO_URL } from "@/lib/puregym-logo";

/** Facebook / Open Graph recommended size; PNG output stays well under 1MB for simple layouts */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_ALT = "Unofficial PureGym Dashboard";

const INTER_700_TTF =
  "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf";

function arrayBufferToBase64PngDataUrl(buf: ArrayBuffer): string {
  return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
}

/** PureGym-inspired palette (matches app theme) */
const COL = {
  teal: "#00a69c",
  tealDark: "#008f85",
  muted: "#6b6b6b",
  soft: "#e6f7f5",
  surface: "#f4f4f4",
} as const;

export async function createShareOgImage(): Promise<ImageResponse> {
  const [fontData, logoBuf] = await Promise.all([
    fetch(INTER_700_TTF).then(r => r.arrayBuffer()),
    fetch(PUREGYM_LOGO_URL).then(r => r.arrayBuffer()),
  ]);
  const logoSrc = arrayBufferToBase64PngDataUrl(logoBuf);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(165deg, ${COL.soft} 0%, ${COL.surface} 45%, #ffffff 100%)`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: `linear-gradient(90deg, ${COL.teal} 0%, ${COL.tealDark} 100%)`,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 72px",
            marginTop: 24,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og Satori output */}
          <img
            src={logoSrc}
            alt=""
            width={420}
            height={168}
            style={{
              objectFit: "contain",
              marginBottom: 32,
            }}
          />
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: -0.2,
            }}
          >
            <span style={{ color: COL.muted }}>Unofficial Pure </span>
            <span style={{ color: COL.teal }}>Gym</span>
            <span style={{ color: COL.muted, marginLeft: "0.35em" }}>Dashboard</span>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: "Inter", data: fontData, style: "normal", weight: 700 }],
    }
  );
}
