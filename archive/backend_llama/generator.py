import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

BASE_MODEL = "meta-llama/Llama-2-7b-hf"
script_dir = os.path.dirname(os.path.abspath(__file__))
ADAPTER_PATH = os.path.join(script_dir, "..", "model", "final_model")

SYSTEM_PROMPT = """You are an expert academic case writer aligned with IFQM standards.
Given company data, generate a structured case study with sections:
BACKGROUND, THEMES, INTERVENTION, RESULTS, LEARNING OUTCOMES.
A case study describes what happened. Never prescribe what should have happened.
Analysis belongs to the student, not the case."""

def load_model():
    """Load base Llama 2 model and apply the trained LoRA adapter on top."""
    tokenizer = AutoTokenizer.from_pretrained(ADAPTER_PATH)
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float16,
        device_map="auto",
        token="your_hf_token_here"
    )
    model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
    return model, tokenizer

def generate(company_name: str, context: str, preferences: dict, model, tokenizer) -> str:
    """Generate full case study text from company name and retrieved context."""
    tone = preferences.get('tone', 'academic')
    length = preferences.get('caseLength', 'standard')
    hook = preferences.get('hookStyle', 'cinematic')

    prompt = f"""<s>[INST] <<SYS>>
{SYSTEM_PROMPT}
<</SYS>>

Company: {company_name}
Context: {context}
Tone: {tone}
Length: {length}
Opening hook style: {hook}
Generate the complete case study now. [/INST]"""

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=1200,
            temperature=0.7,
            top_p=0.9
        )
    full = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return full[len(prompt):].strip()
