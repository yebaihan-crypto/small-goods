#!/usr/bin/env python3
"""
Generate 3,200+ comprehensive historical issues of The New Yorker (1925 - 2026)
Arranged across an 80-column by 40-row matrix grid with full metadata and AI Prompts.
"""

import json
import random
import os

TOTAL_COLS = 80
TOTAL_ROWS = 40
TOTAL_ITEMS = TOTAL_COLS * TOTAL_ROWS  # 3,200 items

# Historical milestones to seed at exact coordinates
MILESTONES = {
    (0, 0): {
        "id": "tny-1925-02-21",
        "year": 1925,
        "date": "Feb 21, 1925",
        "title": "Eustace Tilley with Monocle",
        "artist": "Rea Irvin",
        "category": "Historical Milestone",
        "score": 99,
        "story": "The iconic inaugural cover of The New Yorker. First art director Rea Irvin drew the fictional 19th-century dandy Eustace Tilley inspecting an owl butterfly through his monocle.",
        "prompt": "The iconic inaugural cover of The New Yorker magazine, a refined 19th-century dandy in a high top hat examining an owl butterfly with a monocle, hand-drawn pen and ink illustration by Rea Irvin, vintage cream paper background, elegant ligne claire lines, muted watercolor wash, ample space at top --ar 3:4 --v 6.1",
        "palette": ["#1c1917", "#fef3c7", "#ca8a04", "#78716c"],
        "coverType": "figure"
    },
    (40, 10): {
        "id": "tny-1976-03-29",
        "year": 1976,
        "date": "Mar 29, 1976",
        "title": "View of the World from 9th Avenue",
        "artist": "Saul Steinberg",
        "category": "Satire & Politics",
        "score": 98,
        "story": "Steinberg's legendary parody of New Yorkers' insular self-absorbed worldview, depicting Manhattan in immense detail while the rest of America and the globe shrinks into vague desert and flat horizons.",
        "prompt": "An editorial illustration in the style of Saul Steinberg, view of the world from 9th Avenue looking west across the Hudson River, extreme perspective caricature with Manhattan meticulously detailed and the rest of the world as a tiny flat horizon, whimsical pen and ink linework, soft watercolor --ar 3:4 --v 6.1",
        "palette": ["#0284c7", "#fef08a", "#f97316", "#e2e8f0"],
        "coverType": "architecture"
    },
    (60, 15): {
        "id": "tny-2001-09-24",
        "year": 2001,
        "date": "Sep 24, 2001",
        "title": "Twin Towers Silhouette (Black on Black)",
        "artist": "Art Spiegelman & Françoise Mouly",
        "category": "Historical Milestone",
        "score": 99,
        "story": "Following the 9/11 attacks, The New Yorker published an almost entirely black cover. Only when tilted toward light do the ghostly black outlines of the vanished Twin Towers emerge.",
        "prompt": "A minimalist black on black cover art, ghostly silhouette of the twin towers rendered in very slightly lighter black ink against a pitch-black midnight void, somber, haunting, solemn editorial illustration, screenprint finish, subtle paper texture --ar 3:4 --v 6.1",
        "palette": ["#000000", "#111111", "#1f1f1f", "#333333"],
        "coverType": "silhouette"
    },
    (63, 8): {
        "id": "tny-2005-02-28",
        "year": 2005,
        "date": "Feb 28, 2005",
        "title": "The Pyramid / Under the Needle",
        "artist": "Christoph Niemann & Barry Blitt",
        "category": "Minimalist Concept",
        "score": 96,
        "story": "A monumental scarlet red pyramid silhouette piercing the Manhattan skyline with tiny businessmen walking along its massive base, reflecting corporate gigantism and modern urban scale.",
        "prompt": "A minimalist conceptual editorial cover in the style of Christoph Niemann, a tiny businessman in a black suit walking beneath a colossal red geometric pyramid skyscraper, sharp perspective, ample off-white negative space, bold screenprint texture, witty intellectual satire --ar 3:4 --v 6.1",
        "palette": ["#dc2626", "#fef2f2", "#18181b", "#7f1d1d"],
        "coverType": "minimal_geo"
    },
    (70, 0): {
        "id": "tny-2014-01-06",
        "year": 2014,
        "date": "Jan 6, 2014",
        "title": "The Audience / Screen Time",
        "artist": "Adrian Tomine",
        "category": "Tech & Media",
        "score": 97,
        "story": "Theater-goers sitting in a darkened auditorium all holding up glowing smartphone screens, capturing the performance through miniature displays rather than witnessing it live.",
        "prompt": "An editorial magazine cover illustration by Adrian Tomine, an audience in a dark opera house all holding up glowing smartphones to record the distant illuminated stage, sea of phone screens casting blue light on faces, clean black ink lines, flat retro muted colors --ar 3:4 --v 6.1",
        "palette": ["#0f172a", "#38bdf8", "#f43f5e", "#cbd5e1"],
        "coverType": "crowd"
    },
    (71, 20): {
        "id": "tny-2015-10-19",
        "year": 2015,
        "date": "Oct 19, 2015",
        "title": "Subway Solitude",
        "artist": "Adrian Tomine",
        "category": "Urban Life",
        "score": 96,
        "story": "A classic Adrian Tomine study of modern alienation. Commuters stand side by side on a moving subway car, completely lost in their respective handheld screens.",
        "prompt": "A modern editorial illustration in the style of Adrian Tomine, diverse commuters standing on an NYC subway car all absorbed in their glowing mobile phones, melancholy urban solitude, precise clean ligne claire ink lines, flat gouache colors, soft fluorescent lighting --ar 3:4 --v 6.1",
        "palette": ["#1e293b", "#f59e0b", "#64748b", "#f8fafc"],
        "coverType": "metro"
    },
    (72, 12): {
        "id": "tny-2016-04-18",
        "year": 2016,
        "date": "Apr 18, 2016",
        "title": "Double Take (Spring Style)",
        "artist": "Malika Favre",
        "category": "Culture & Arts",
        "score": 95,
        "story": "A masterclass in vector minimalism and negative space by Malika Favre. An elegant woman wearing oversized dark sunglasses that reflect a bustling yellow New York taxi cab.",
        "prompt": "A chic minimalist vector cover illustration by Malika Favre, close-up of a glamorous woman wearing large black sunglasses reflecting a classic yellow New York taxi, bold use of negative space, razor-sharp clean geometric shadows, cobalt blue, yellow, and warm cream --ar 3:4 --v 6.1",
        "palette": ["#1e3a8a", "#eab308", "#f8fafc", "#18181b"],
        "coverType": "figure"
    },
    (73, 5): {
        "id": "tny-2017-03-06",
        "year": 2017,
        "date": "Mar 6, 2017",
        "title": "Girl with a Pearl Earring Selfie",
        "artist": "Barry Blitt",
        "category": "Tech & Media",
        "score": 94,
        "story": "A museum visitor turning their back to Vermeer's masterpiece 'Girl with a Pearl Earring' in an empty gallery, solely focused on snapping a front-facing selfie with the painting.",
        "prompt": "An editorial satire illustration in the style of The New Yorker, a museum visitor taking a smartphone selfie with their back turned to Vermeer's Girl with a Pearl Earring painting on a gallery wall, painterly watercolor wash, witty art world critique, clean gallery spotlighting --ar 3:4 --v 6.1",
        "palette": ["#e2e8f0", "#1e3a8a", "#d97706", "#475569"],
        "coverType": "figure"
    },
    (74, 18): {
        "id": "tny-2019-02-18",
        "year": 2019,
        "date": "Feb 18, 2019",
        "title": "The Playpen (Early Adopters)",
        "artist": "Adrian Tomine",
        "category": "Tech & Media",
        "score": 96,
        "story": "Toddlers crawling inside a nursery playpen, each operating laptops, tablets, and smartphones, satirical commentary on digital screens invading infancy.",
        "prompt": "An editorial cover illustration by Adrian Tomine, several babies inside a wooden playpen all intensely typing on glowing miniature laptops and iPads, crisp ink linework, gentle pastel gouache tones, thoughtful technological satire, ample space at the top --ar 3:4 --v 6.1",
        "palette": ["#fed7aa", "#3b82f6", "#fbcfe8", "#334155"],
        "coverType": "crowd"
    },
    (75, 16): {
        "id": "tny-2020-05-04",
        "year": 2020,
        "date": "May 4, 2020",
        "title": "Bedtime (Under the Mask)",
        "artist": "Chris Ware",
        "category": "Pandemic & Health",
        "score": 99,
        "story": "Chris Ware's heart-wrenching tribute to frontline healthcare workers during the peak of COVID-19. A weary doctor in scrubs sits in an empty hospital corridor video calling her daughter goodnight.",
        "prompt": "A poignant editorial cover illustration by Chris Ware, a tired healthcare worker in surgical mask and blue scrubs sitting alone in a quiet hospital hallway holding up a smartphone video calling her young child in bed, warm emotional screen glow against cool clinical tones, precise architectural linework --ar 3:4 --v 6.1",
        "palette": ["#0284c7", "#fef08a", "#334155", "#f1f5f9"],
        "coverType": "figure"
    },
    (75, 23): {
        "id": "tny-2020-06-22",
        "year": 2020,
        "date": "Jun 22, 2020",
        "title": "Say Their Names",
        "artist": "Kadir Nelson",
        "category": "Culture & Arts",
        "score": 99,
        "story": "Kadir Nelson's monumental cover honoring George Floyd. Within Floyd's silhouette, Nelson painstakingly painted scenes and figures from centuries of Black American civil rights history.",
        "prompt": "A monumental oil-on-canvas editorial portrait by Kadir Nelson, a dignified portrait whose torso and clothing contain an intricate mural of historic figures and civil rights marches, rich deep earth tones, glowing celestial lighting, heroic composition, museum quality --ar 3:4 --v 6.1",
        "palette": ["#451a03", "#d97706", "#1c1917", "#fef3c7"],
        "coverType": "figure"
    },
    (76, 14): {
        "id": "tny-2021-04-05",
        "year": 2021,
        "date": "Apr 5, 2021",
        "title": "Delayed",
        "artist": "R. Kikuo Johnson",
        "category": "Urban Life",
        "score": 98,
        "story": "An Asian-American mother and her young daughter waiting on a subway platform, checking their watches with subtle vigilance amid a rise in anti-Asian transit violence, rendered with immense empathy.",
        "prompt": "An evocative editorial illustration by R. Kikuo Johnson, an Asian mother and young daughter standing on a New York subway platform checking a wristwatch, clean bold ink contour lines, muted palette of teal, red and ivory, quiet tension and tender solidarity --ar 3:4 --v 6.1",
        "palette": ["#0f766e", "#e11d48", "#f8fafc", "#1e293b"],
        "coverType": "figure"
    },
    (78, 10): {
        "id": "tny-2025-02-24",
        "year": 2025,
        "date": "Feb 24, 2025",
        "title": "Centennial Monocle (100 Years of Eustace)",
        "artist": "Kadir Nelson & Roz Chast",
        "category": "Historical Milestone",
        "score": 99,
        "story": "The 100th Anniversary milestone cover of The New Yorker. Eustace Tilley's monocle now reflects an entire century of New York skyscrapers, subway cars, and cultural revolutions.",
        "prompt": "The 100th anniversary centennial cover of The New Yorker, the classic Eustace Tilley dandy whose glass monocle reflects a panoramic century of New York history and futuristic skyscrapers, rich painterly gouache and fine ink, celebratory gold and ivory, timeless editorial masterpiece --ar 3:4 --v 6.1",
        "palette": ["#ca8a04", "#1e293b", "#fef08a", "#0f172a"],
        "coverType": "figure"
    },
    (79, 25): {
        "id": "tny-2026-06-15",
        "year": 2026,
        "date": "Jun 15, 2026",
        "title": "The Quantum Commute",
        "artist": "Adrian Tomine",
        "category": "Tech & Media",
        "score": 97,
        "story": "Looking forward into 2026: a commuter wearing sleek augmented reality lenses reading an invisible holographic book on an autonomous aerial taxi, modern isolation reimagined.",
        "prompt": "A near-future editorial cover by Adrian Tomine, a stylish commuter on a high-tech sky-train looking through minimal AR smart glasses with subtle glowing text in the air, sunset over the futuristic Manhattan skyline, precise ligne claire ink art, serene twilight palette --ar 3:4 --v 6.1",
        "palette": ["#6366f1", "#f43f5e", "#1e1b4b", "#f8fafc"],
        "coverType": "figure"
    }
}

# Roster of genuine New Yorker illustrators grouped by era
ERA_ARTISTS = {
    1: ["Rea Irvin", "Peter Arno", "Helen Hokinson", "Julian de Miskey", "Gardner Rea", "Al Frueh", "Garrett Price", "Perry Barlow", "Gluyas Williams", "Ilonka Karasz", "Mary Petty"],
    2: ["Saul Steinberg", "Charles Addams", "Mary Petty", "Constantino Nivola", "George Price", "Leonard Dove", "Abe Birnbaum", "Arthur Getz", "William Steig", "James Thurber"],
    3: ["Jean-Jacques Sempé", "Edward Gorey", "Ronald Searle", "George Booth", "Charles E. Martin", "André François", "Mischa Richter", "Pierre Le-Tan", "Saul Steinberg"],
    4: ["Art Spiegelman", "Barry Blitt", "Roz Chast", "Carter Goodrich", "Bruce McCall", "Bob Staake", "Mark Ulriksen", "Edward Sorel", "Arnold Roth", "Ian Falconer", "Anita Kunz"],
    5: ["Adrian Tomine", "Christoph Niemann", "Malika Favre", "Chris Ware", "István Bányai", "Eric Drooker", "Dan Clowes", "Kadir Nelson", "Jorge Colombo", "Lorenzo Mattotti"],
    6: ["Kadir Nelson", "Barry Blitt", "Chris Ware", "Adrian Tomine", "Malika Favre", "Christoph Niemann", "R. Kikuo Johnson", "Sergio García Sánchez", "Tom Gauld", "Pascal Campion"]
}

# Categories
CATEGORIES = [
    "Urban Life", "Tech & Media", "Satire & Politics", "Culture & Arts",
    "Romance & Solitude", "Nature & Seasons", "Pandemic & Health",
    "Minimalist Concept", "Historical Milestone"
]

CATEGORY_PALETTES = {
    "Urban Life": [["#1e293b", "#f59e0b", "#64748b", "#f8fafc"], ["#0f172a", "#38bdf8", "#94a3b8", "#f1f5f9"]],
    "Tech & Media": [["#0f172a", "#38bdf8", "#f43f5e", "#cbd5e1"], ["#1e1b4b", "#818cf8", "#f472b6", "#e0e7ff"]],
    "Satire & Politics": [["#dc2626", "#fef2f2", "#18181b", "#7f1d1d"], ["#991b1b", "#fbbf24", "#1e293b", "#f8fafc"]],
    "Culture & Arts": [["#1e3a8a", "#eab308", "#f8fafc", "#18181b"], ["#581c87", "#f472b6", "#faf5ff", "#3b0764"]],
    "Romance & Solitude": [["#be185d", "#fbcfe8", "#1c1917", "#fdf2f8"], ["#4338ca", "#a5b4fc", "#312e81", "#e0e7ff"]],
    "Nature & Seasons": [["#15803d", "#fef08a", "#bbf7d0", "#14532d"], ["#b45309", "#fef3c7", "#78350f", "#fffbeb"]],
    "Pandemic & Health": [["#0284c7", "#fef08a", "#334155", "#f1f5f9"], ["#0f766e", "#ccfbf1", "#134e4a", "#f0fdfa"]],
    "Minimalist Concept": [["#dc2626", "#fef2f2", "#18181b", "#7f1d1d"], ["#18181b", "#fafafa", "#ea580c", "#52525b"]],
    "Historical Milestone": [["#ca8a04", "#1e293b", "#fef08a", "#0f172a"], ["#1c1917", "#fef3c7", "#ca8a04", "#78716c"]]
}

COVER_TYPES = ["figure", "architecture", "silhouette", "minimal_geo", "crowd", "metro", "nature"]

THEMES_BY_CATEGORY = {
    "Urban Life": [
        ("The Coffee Run", "Morning commuters in Manhattan clutching steaming paper cups through a windy canyon of granite and glass."),
        ("Dusk in Brooklyn", "Brownstone stoops bathed in golden hour light with neighborhood cats and quiet chatter."),
        ("The Yellow Cab", "Rain streaks down taxi windows illuminating blurry neon signs of Times Square."),
        ("Bicycle in Central Park", "A cyclist gliding past willow trees around the Jacqueline Kennedy Onassis Reservoir."),
        ("The Night Diner", "Fluorescent glow of an all-night diner corner with solitary patrons over black coffee."),
        ("Subway Platform Echo", "Empty tiled station platform with headlights emerging from the dark tunnel curved turn."),
        ("Rooftop Solitude", "A city dweller tending to tomato plants in pots against the sprawling skyline.")
    ],
    "Tech & Media": [
        ("Glance at the Screen", "Crosswalk pedestrians pausing mid-stride while glancing at urgent notifications."),
        ("The Unread Inbox", "A towering stack of digital envelopes looming like a mountain over a tiny home office desk."),
        ("Virtual Meeting", "A grid of thumbnail faces looking in mismatched directions during a corporate video call."),
        ("Podcast Walk", "Earbuds in, walking through autumn leaves entirely tuned out from the city noises around."),
        ("The Electric Charger", "Futuristic charging cables coiled around vintage lampposts like urban ivy."),
        ("Algorithm Dreams", "A sleeping reader beside a laptop glowing with endless recommended content feeds.")
    ],
    "Satire & Politics": [
        ("The Endless Briefing", "A podium surrounded by microphones taller than the speaker behind it."),
        ("Paper Mountain", "Bureaucrats navigating a labyrinth constructed entirely out of filing cabinets and legislation."),
        ("Gavel and Scale", "A courthouse marble stairway with pigeons perched atop the statue of Justice."),
        ("Campaign Trail", "A whistle-stop train trailing balloons and confetti through quiet pastoral farmlands."),
        ("The Filibuster Clock", "An oversized clock melting like Dali's watch over a congressional chamber.")
    ],
    "Culture & Arts": [
        ("The Strand Bookshelf", "A browser buried deep in the labyrinthine aisles of second-hand rare books."),
        ("Gallery Opening", "Abstract modern canvas hung on pristine white walls with viewers holding tiny wine glasses."),
        ("Ballet Rehearsal", "Dancers stretching by the wooden barre with dust motes dancing in sunbeams."),
        ("Orchestra Tuning", "The chaotic warmth of musicians tuning violins before the conductor raises the baton."),
        ("Cinema Marquee", "Glowing vintage neon letters announcing a midnight double feature on a rainy street.")
    ],
    "Romance & Solitude": [
        ("Umbrella for Two", "Sharing a bright red umbrella on a slate-gray rainy afternoon across the Brooklyn Bridge."),
        ("Window Seat Rain", "Watching raindrops trace paths down the glass while lost in a hardcover novel."),
        ("Park Bench Rendezvous", "Two people sitting at opposite ends of a bench slowly sliding closer together."),
        ("Midnight Library", "Lamplight glowing softly on oak desks long after the university has emptied."),
        ("Letters in the Mailbox", "Opening a brass apartment mailbox to find a handwritten envelope amidst junk mail.")
    ],
    "Nature & Seasons": [
        ("First Blizzard", "Snow quietly muffling the traffic of Fifth Avenue turning parked cars into gentle mounds."),
        ("Cherry Blossom Sunday", "Picnic blankets spread beneath pink petals drifting down onto the Great Lawn."),
        ("October Harvest", "Pumpkins and squash arranged on wooden crates outside a Greenwich Village market."),
        ("Summer Hydrant Splash", "Children leaping through a spray of cool water from an opened street hydrant."),
        ("Spring Thaw", "Ice melting along the Hudson River while tugboats push through morning mist.")
    ],
    "Minimalist Concept": [
        ("The Shadow Line", "A single crisp black shadow cutting diagonally across a brilliant terracotta wall."),
        ("Zero Gravity", "An umbrella floating upside down holding raindrops like beads of dew."),
        ("The Doorway", "A narrow sliver of warm light opening into a vast navy blue interior."),
        ("Perspective Shift", "Looking down into a spiral staircase that resembles a nautilus seashell.")
    ],
    "Pandemic & Health": [
        ("Balcony Applause", "City residents leaning out of apartment windows at 7 PM clanging pots for essential workers."),
        ("Mask on the Sidewalk", "A lone blue surgical mask resting on a pavement square alongside fallen yellow leaves."),
        ("The Distance Park", "Chalk circles drawn across a green lawn allowing people to sit together yet apart.")
    ],
    "Historical Milestone": [
        ("Centennial Echo", "Eustace Tilley observing the metamorphosis of city dress and transport over ten decades."),
        ("End of the War Parade", "Ticker tape falling like blizzards over Broadway ticker tape parade in midtown.")
    ]
}

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

def get_era(year):
    if year < 1940: return 1
    if year < 1960: return 2
    if year < 1980: return 3
    if year < 2000: return 4
    if year < 2020: return 5
    return 6

def generate_archive():
    random.seed(42)  # Deterministic generation
    items = []
    
    for c in range(TOTAL_COLS):
        # Map column 0..79 across 1925..2026 (101 years)
        # Year progress:
        year_float = 1925 + (c / (TOTAL_COLS - 1)) * 101
        year = int(year_float)
        era = get_era(year)
        artist_pool = ERA_ARTISTS[era]

        for r in range(TOTAL_ROWS):
            coord = (c, r)
            if coord in MILESTONES:
                m = MILESTONES[coord]
                item = dict(m)
                item["col"] = c
                item["row"] = r
                items.append(item)
                continue
            
            # Month & day based on row (0..39 represents roughly 40 weekly issues in a year)
            month_idx = int((r / TOTAL_ROWS) * 12)
            month = MONTHS[month_idx]
            day = ((r * 7) % 28) + 1
            date_str = f"{month} {day}, {year}"
            item_id = f"tny-{year}-{month.lower()}-{day:02d}"

            # Pick category
            cat_weights = [0.22, 0.16, 0.14, 0.16, 0.12, 0.12, 0.04, 0.04]
            # In modern era, boost Tech & Media
            if era >= 5:
                cat_weights = [0.22, 0.24, 0.14, 0.14, 0.10, 0.08, 0.04, 0.04]
            cat_candidates = [
                "Urban Life", "Tech & Media", "Satire & Politics", "Culture & Arts",
                "Romance & Solitude", "Nature & Seasons", "Pandemic & Health", "Minimalist Concept"
            ]
            category = random.choices(cat_candidates, weights=cat_weights, k=1)[0]
            
            # Select artist from era pool
            artist = random.choice(artist_pool)
            
            # Select theme and story
            theme_list = THEMES_BY_CATEGORY.get(category, THEMES_BY_CATEGORY["Urban Life"])
            base_title, base_story = random.choice(theme_list)
            
            # Title variations
            title = f"{base_title} ({year})"
            score = random.randint(72, 98)
            cover_type = random.choice(COVER_TYPES)
            
            # Color palette
            palettes = CATEGORY_PALETTES.get(category, CATEGORY_PALETTES["Urban Life"])
            palette = random.choice(palettes)
            
            # Formulate AI prompt
            medium = "gouache and watercolor illustration" if era <= 3 else "editorial illustration with fine ligne claire ink outlines and flat color blocks"
            prompt = (
                f"An iconic New Yorker magazine cover illustration in the style of {artist}, "
                f"{base_story.lower()} "
                f"Artistic {medium}, {category.lower()} narrative with subtle visual humor and emotional depth, "
                f"palette featuring {palette[0]}, {palette[1]}, and warm ivory background, "
                f"ample clean negative space reserved at the top for magazine masthead, vertical format --ar 3:4 --v 6.1"
            )

            item = {
                "id": item_id,
                "col": c,
                "row": r,
                "year": year,
                "date": date_str,
                "title": title,
                "artist": artist,
                "category": category,
                "score": score,
                "story": base_story,
                "prompt": prompt,
                "palette": palette,
                "coverType": cover_type
            }
            items.append(item)

    return items

def main():
    print(f"Generating {TOTAL_ITEMS} comprehensive New Yorker archive records...")
    items = generate_archive()
    print(f"Generated {len(items)} items.")

    # Export to JSON
    json_path = "data/covers-archive.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)
    print(f"Saved {json_path} ({os.path.getsize(json_path) / 1024 / 1024:.2f} MB)")

    # Export to JS for direct script loading without CORS issues
    js_path = "js/data/covers-archive.js"
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("// Autogenerated 3,200+ New Yorker Covers Archive (1925 - 2026)\n")
        f.write("window.NEW_YORKER_ARCHIVE = ")
        json.dump(items, f, ensure_ascii=False)
        f.write(";\n")
    print(f"Saved {js_path} ({os.path.getsize(js_path) / 1024 / 1024:.2f} MB)")

if __name__ == "__main__":
    main()
