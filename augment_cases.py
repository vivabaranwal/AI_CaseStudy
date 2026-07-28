import os
import json
import time
from openai import OpenAI

# Initialize the OpenAI-compatible client for Google Gemini
api_key = os.environ.get("GEMINI_API_KEY", "your_api_key_here")
client = OpenAI(api_key=api_key, base_url="https://generativelanguage.googleapis.com/v1beta/openai/")

OUT_PATH = os.path.join(".", "data", "training_data.json")

def load_existing_cases():
    """Load existing training data and return cases + set of already-processed IDs."""
    if os.path.exists(OUT_PATH):
        try:
            with open(OUT_PATH, 'r', encoding='utf-8') as f:
                cases = json.load(f)
            processed_ids = {c.get("case_study_id") for c in cases if c.get("case_study_id")}
            print(f"Loaded {len(cases)} existing cases. Already processed IDs: {len(processed_ids)}")
            return cases, processed_ids
        except Exception as e:
            print(f"[WARNING] Could not load existing training data: {e}. Starting fresh.")
    return [], set()

def save_cases(cases):
    """Write all cases to training_data.json."""
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding='utf-8') as f:
        json.dump(cases, f, indent=2, ensure_ascii=False)

def generate_variations(original_case):
    title = original_case.get('title', 'Unknown Case')
    print(f"  -> Sending API request to generate 3 variations for: '{title}'...")

    prompt = f"""Given this JSON case study structure:
{json.dumps(original_case, indent=2)}

Generate 3 alternative versions of this case study. 
- Version 1: Emphasize a different problem angle (e.g., operational vs. strategic).
- Version 2: Emphasize a different learning outcome.
- Version 3: Change the primary stakeholder perspective.

IMPORTANT: Return strictly a valid JSON array containing exactly 3 objects. Do not include markdown formatting (like ```json), introductions, or explanations. Each object must have the exact same JSON structure as the input.
"""

    max_retries = 8
    retry_delay = 15  # seconds

    for attempt in range(1, max_retries + 1):
        try:
            response = client.chat.completions.create(
                model="gemini-2.5-flash-lite",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                timeout=90.0   # raised from 30s — Gemini can be slow under load
            )

            content = response.choices[0].message.content.strip()

            # Strip markdown code fences if model adds them
            if content.startswith("```"):
                first_newline = content.find("\n")
                if first_newline != -1:
                    content = content[first_newline:].strip()
                if content.endswith("```"):
                    content = content[:-3].strip()

            variations = json.loads(content)
            if isinstance(variations, list) and len(variations) == 3:
                return variations
            else:
                count = len(variations) if isinstance(variations, list) else 'not a list'
                print(f"  -> [WARNING] API returned JSON but not 3 elements (got: {count}). Skipping.")
                return []

        except json.JSONDecodeError as jde:
            print(f"  -> [ERROR] Failed to parse API response as JSON: {jde}")
            return []
        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "rate limit" in err_msg.lower() or "quota" in err_msg.lower():
                print(f"  -> [RATE LIMIT] Attempt {attempt}/{max_retries} — sleeping {retry_delay}s...")
                time.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 120)  # cap backoff at 2 min
            elif "503" in err_msg or "unavailable" in err_msg.lower():
                print(f"  -> [503 UNAVAILABLE] Attempt {attempt}/{max_retries} — sleeping {retry_delay}s...")
                time.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 120)
            else:
                print(f"  -> [ERROR] General API Exception: {e}")
                return []

    print(f"  -> [ERROR] Failed to generate variations for '{title}' after {max_retries} attempts.")
    return []


def main():
    structured_dir = os.path.join(".", "data", "structured")

    print("Checking directories...")
    if not os.path.exists(structured_dir):
        print(f"[ERROR] Structured case directory does not exist at: {structured_dir}")
        return

    files = sorted(f for f in os.listdir(structured_dir) if f.endswith(".json"))
    print(f"Found {len(files)} structured JSON files.\n")

    # Load existing data and find which cases are already done
    all_cases, processed_ids = load_existing_cases()

    skipped = 0
    processed = 0

    for idx, json_file in enumerate(files, 1):
        file_path = os.path.join(structured_dir, json_file)

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original = json.load(f)
        except Exception as e:
            print(f"[{idx}/{len(files)}] [ERROR] Could not read {json_file}: {e}")
            continue

        case_id = original.get("case_study_id", "")

        # Skip if already in training data
        if case_id and case_id in processed_ids:
            print(f"[{idx}/{len(files)}] SKIPPING (already processed): {json_file}")
            skipped += 1
            continue

        print(f"[{idx}/{len(files)}] Processing: {json_file}")
        print(f"  -> Loaded original case: '{original.get('title', 'Unknown Case')}'")

        # Add original
        all_cases.append(original)

        # Generate 3 variations
        variations = generate_variations(original)
        if variations:
            all_cases.extend(variations)
            print(f"  -> Success! Added original + {len(variations)} variations.")
        else:
            print(f"  -> [WARNING] No variations generated; original still added.")

        # --- INCREMENTAL SAVE after every case ---
        try:
            save_cases(all_cases)
            print(f"  -> Saved incrementally. Total in file: {len(all_cases)}")
        except Exception as e:
            print(f"  -> [ERROR] Could not save: {e}")

        processed += 1
        print("-" * 50)

        # Pace requests to avoid rate-limit cascade
        if idx < len(files):
            print(f"  -> Waiting 10s before next case...")
            time.sleep(10)

    print(f"\n=== DONE ===")
    print(f"Processed: {processed} | Skipped (already done): {skipped}")
    print(f"Total cases in training_data.json: {len(all_cases)}")

if __name__ == "__main__":
    main()