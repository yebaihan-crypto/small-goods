// WebGL Vertex and Fragment Shaders for Spherical Fisheye Lens Distortion Matrix
window.SHADERS = {
  vertex: `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = (a_position + 1.0) * 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `,

  fragment: `
    precision highp float;
    varying vec2 v_uv;

    uniform vec2 u_resolution;
    uniform vec2 u_mouse;       // Pixel coordinates of lens center
    uniform float u_radius;     // Lens radius in pixels
    uniform float u_power;      // Magnification power (e.g. 0.8 - 1.8)
    uniform vec2 u_camera;      // World camera position
    uniform float u_zoom;       // Camera zoom scale
    uniform float u_time;
    uniform vec2 u_gridSize;    // vec2(80.0, 40.0)
    uniform vec2 u_cellSize;    // vec2(100.0, 140.0)
    uniform vec2 u_cellGap;     // vec2(10.0, 10.0)
    uniform float u_theme;      // 0.0 = dark, 1.0 = light paper

    // Pseudo-random hash for procedural color and pattern variation
    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    vec3 hash23(vec2 p) {
      float n = hash21(p);
      float n2 = hash21(p + vec2(13.1, 71.7));
      float n3 = hash21(p + vec2(127.3, 311.9));
      return vec3(n, n2, n3);
    }

    // Box distance for rounded card corners
    float sdRoundBox(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    }

    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      vec2 mouseCoord = u_mouse;
      
      // Vector from fragment to lens center
      vec2 delta = fragCoord - mouseCoord;
      float dist = length(delta);
      
      vec2 warpedFrag = fragCoord;
      float chromatic = 0.0;
      float rimHighlight = 0.0;
      float lensMask = 0.0;

      // Spherical fisheye bulge calculation
      if (dist < u_radius) {
        float normDist = dist / u_radius;
        lensMask = 1.0;
        
        // Spherical surface warp (power curve + dome projection)
        float warpFactor = pow(normDist, 1.0 + u_power);
        vec2 dir = delta / max(dist, 0.0001);
        warpedFrag = mouseCoord + dir * (warpFactor * u_radius);
        
        // Chromatic aberration intensity at the rim
        chromatic = smoothstep(0.65, 0.98, normDist) * 8.0;
        
        // Specular glass ring highlight at the boundary
        rimHighlight = smoothstep(0.94, 0.98, normDist) * (1.0 - smoothstep(0.98, 1.02, normDist));
      }

      // Convert warped screen coordinates to world coordinates
      vec2 screenCenter = u_resolution * 0.5;
      vec2 worldPos = (warpedFrag - screenCenter) / u_zoom + u_camera;

      // Total cell pitch
      vec2 cellPitch = u_cellSize + u_cellGap;
      vec2 totalGridDim = u_gridSize * cellPitch;
      vec2 gridStart = -totalGridDim * 0.5;

      vec2 localGrid = worldPos - gridStart;
      vec2 cellIndex = floor(localGrid / cellPitch);

      // Background color base
      vec3 bgColor = mix(vec3(0.04, 0.04, 0.05), vec3(0.96, 0.95, 0.93), u_theme);

      // Check if worldPos falls inside the 80x40 grid bounds
      if (cellIndex.x >= 0.0 && cellIndex.x < u_gridSize.x &&
          cellIndex.y >= 0.0 && cellIndex.y < u_gridSize.y) {
        
        // Cell local coordinates centered at (0, 0)
        vec2 cellCenter = gridStart + (cellIndex + 0.5) * cellPitch;
        vec2 localPos = worldPos - cellCenter;
        
        // Card rounded box test
        float dBox = sdRoundBox(localPos, u_cellSize * 0.5, 6.0);
        
        if (dBox < 0.0) {
          // Inside a New Yorker cover card!
          vec2 uvCard = (localPos + u_cellSize * 0.5) / u_cellSize; // (0,0) bottom-left, (1,1) top-right
          
          // Generate procedural cover aesthetic based on cell coordinates
          vec3 rH = hash23(cellIndex);
          float eraFactor = cellIndex.x / u_gridSize.x; // 0.0 in 1925, 1.0 in 2026
          
          // Diverse retro palettes inspired by The New Yorker covers
          vec3 colSky;
          vec3 colSubject;
          vec3 colAccent;
          
          if (rH.x < 0.2) {
            // Navy, gold, cream (classic)
            colSky = vec3(0.12, 0.16, 0.24);
            colSubject = vec3(0.85, 0.65, 0.15);
            colAccent = vec3(0.95, 0.92, 0.85);
          } else if (rH.x < 0.4) {
            // Terracotta, forest green, warm ivory
            colSky = vec3(0.82, 0.35, 0.22);
            colSubject = vec3(0.15, 0.35, 0.22);
            colAccent = vec3(0.98, 0.95, 0.88);
          } else if (rH.x < 0.6) {
            // Cobalt blue, taxi yellow, black (modern Tomine / Malika)
            colSky = vec3(0.12, 0.24, 0.55);
            colSubject = vec3(0.95, 0.78, 0.12);
            colAccent = vec3(0.1, 0.1, 0.12);
          } else if (rH.x < 0.8) {
            // Muted autumn ochre & charcoal
            colSky = vec3(0.75, 0.55, 0.25);
            colSubject = vec3(0.25, 0.22, 0.20);
            colAccent = vec3(0.94, 0.90, 0.82);
          } else {
            // Lavender dusk & teal (contemporary)
            colSky = vec3(0.25, 0.35, 0.45);
            colSubject = vec3(0.88, 0.45, 0.65);
            colAccent = vec3(0.92, 0.94, 0.96);
          }

          vec3 cardColor = colSky;

          // Upper Masthead Bar (The New Yorker iconic header strip)
          if (uvCard.y > 0.82) {
            // Masthead area
            cardColor = mix(cardColor, colAccent, 0.85);
            // Simulated logo line
            if (uvCard.y > 0.88 && uvCard.y < 0.94 && abs(uvCard.x - 0.5) < 0.38) {
              cardColor = mix(cardColor, vec3(0.1, 0.1, 0.12), 0.9);
            }
          } else {
            // Cover illustration area
            // Geometric shapes simulating figures, architecture, and silhouettes
            float motifType = rH.y;
            if (motifType < 0.3) {
              // Central silhouette figure or portrait
              float dFig = length(vec2(uvCard.x - 0.5, (uvCard.y - 0.45) * 1.3));
              if (dFig < 0.22) {
                cardColor = mix(colSubject, colAccent, smoothstep(0.0, 0.2, uvCard.y - 0.3));
              }
            } else if (motifType < 0.6) {
              // City skyline / architectural blocks
              float bldHeight = 0.3 + 0.35 * sin(uvCard.x * 14.0 + rH.z * 10.0);
              if (uvCard.y < bldHeight) {
                cardColor = colSubject;
                // Little glowing windows
                vec2 winGrid = fract(uvCard * vec2(20.0, 30.0));
                if (winGrid.x > 0.3 && winGrid.y > 0.3 && hash21(floor(uvCard * vec2(20.0, 30.0))) > 0.6) {
                  cardColor = colAccent;
                }
              }
            } else if (motifType < 0.8) {
              // Diagonal bold minimalist shadow (Christoph Niemann style)
              if (uvCard.x + uvCard.y * 0.7 > 0.8) {
                cardColor = colSubject;
              }
            } else {
              // Organic park trees / landscape (Sempé style)
              float dTree = length(vec2(uvCard.x - 0.5, uvCard.y - 0.35));
              if (dTree < 0.28) {
                cardColor = colSubject;
              }
            }

            // Fine black vintage border around cover art
            if (uvCard.x < 0.03 || uvCard.x > 0.97 || uvCard.y < 0.03 || uvCard.y > 0.97) {
              cardColor = mix(cardColor, vec3(0.15, 0.15, 0.15), 0.85);
            }
          }

          // Card shadow and inner rim
          float innerRim = smoothstep(-1.0, 0.0, dBox);
          cardColor = mix(cardColor, vec3(0.0), innerRim * 0.4);

          bgColor = cardColor;
        }
      }

      // Lens lighting effects
      if (lensMask > 0.5) {
        // Specular rim light
        bgColor += vec3(0.7, 0.85, 1.0) * rimHighlight * 0.8;
        
        // Subtle spherical glass vignette and contrast boost inside lens
        float normDist = dist / u_radius;
        float centerGlow = (1.0 - normDist * normDist) * 0.08;
        bgColor += vec3(centerGlow);
      } else {
        // Subtle outer ambient vignette
        vec2 normScreen = fragCoord / u_resolution;
        float vign = length(normScreen - 0.5) * 1.414;
        bgColor *= (1.0 - smoothstep(0.4, 1.3, vign) * 0.6);
      }

      gl_FragColor = vec4(bgColor, 1.0);
    }
  `
};
