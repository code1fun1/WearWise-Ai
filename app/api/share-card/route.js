export const dynamic = "force-dynamic";

import { ImageResponse } from "next/og";

export const runtime = "edge";

const W = 1080;
const H = 1080;
const PAD = 72;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const occasion    = searchParams.get("occasion")    || "casual";
    const explanation = (searchParams.get("explanation") || "").slice(0, 140);
    const itemUrls    = (searchParams.get("items") || "")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 3);

    // Item dimensions scale with count
    const itemW = itemUrls.length === 1 ? 520 : itemUrls.length === 2 ? 380 : 264;
    const itemH = Math.round(itemW * 1.28);

    return new ImageResponse(
      (
        <div
          style={{
            width:           W,
            height:          H,
            background:      "linear-gradient(145deg, #1e0a3c 0%, #4c1d95 45%, #7e22ce 75%, #be185d 100%)",
            display:         "flex",
            flexDirection:   "column",
            alignItems:      "center",
            justifyContent:  "center",
            padding:         PAD,
            fontFamily:      "sans-serif",
            position:        "relative",
          }}
        >
          {/* Subtle noise overlay — faint circle accents */}
          <div
            style={{
              position:        "absolute",
              top:             -160,
              right:           -160,
              width:           480,
              height:          480,
              borderRadius:    "50%",
              background:      "rgba(255,255,255,0.04)",
              display:         "flex",
            }}
          />
          <div
            style={{
              position:        "absolute",
              bottom:          -120,
              left:            -120,
              width:           360,
              height:          360,
              borderRadius:    "50%",
              background:      "rgba(255,255,255,0.04)",
              display:         "flex",
            }}
          />

          {/* Top logo */}
          <div
            style={{
              display:         "flex",
              alignItems:      "center",
              gap:             12,
              marginBottom:    48,
            }}
          >
            <div
              style={{
                width:           36,
                height:          36,
                borderRadius:    10,
                background:      "rgba(255,255,255,0.2)",
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                fontSize:        20,
              }}
            >
              ✦
            </div>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
              WEARWIZE
            </span>
          </div>

          {/* Item photos */}
          {itemUrls.length > 0 && (
            <div style={{ display: "flex", gap: 20, marginBottom: 44 }}>
              {itemUrls.map((url, i) => (
                <div
                  key={i}
                  style={{
                    width:           itemW,
                    height:          itemH,
                    borderRadius:    28,
                    overflow:        "hidden",
                    border:          "2.5px solid rgba(255,255,255,0.25)",
                    boxShadow:       "0 24px 48px rgba(0,0,0,0.45)",
                    display:         "flex",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    width={itemW}
                    height={itemH}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    alt=""
                  />
                </div>
              ))}
            </div>
          )}

          {/* Occasion badge */}
          <div
            style={{
              display:         "flex",
              alignItems:      "center",
              gap:             8,
              background:      "rgba(255,255,255,0.15)",
              border:          "1px solid rgba(255,255,255,0.25)",
              borderRadius:    100,
              padding:         "10px 28px",
              marginBottom:    explanation ? 28 : 0,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }}>◆</span>
            <span
              style={{
                color:           "white",
                fontSize:        22,
                fontWeight:      600,
                textTransform:   "capitalize",
                letterSpacing:   1,
              }}
            >
              {occasion}
            </span>
          </div>

          {/* Explanation */}
          {explanation && (
            <div
              style={{
                color:           "rgba(255,255,255,0.80)",
                fontSize:        24,
                textAlign:       "center",
                maxWidth:        820,
                lineHeight:      1.55,
                fontStyle:       "italic",
                marginTop:       4,
              }}
            >
              "{explanation}"
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              position:        "absolute",
              bottom:          44,
              display:         "flex",
              alignItems:      "center",
              gap:             8,
              color:           "rgba(255,255,255,0.35)",
              fontSize:        18,
              letterSpacing:   1,
            }}
          >
            <span>Styled with AI</span>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>✦</span>
            <span>wearwize.app</span>
          </div>
        </div>
      ),
      { width: W, height: H }
    );
  } catch (err) {
    return new Response("Failed to generate share card", { status: 500 });
  }
}
