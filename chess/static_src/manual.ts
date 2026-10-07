/**
 * Manual Edit page: dynamic add/update/delete form for Player/Game/LessonClass rows.
 * 1:1 port of chess/static/manual.js — see /convert_to_type.md before changing this file.
 * Independent of utils.ts (no shared state, no BOARDS, no CSRF usage here today).
 */
import type { ManualAction, ManualModelName, ObjectData } from "./types";

let selectedAction: ManualAction | null = null;
let selectedModel: ManualModelName | null = null;

document.querySelectorAll<HTMLInputElement>('input[name="action"]').forEach(radio =>
    radio.addEventListener('change', e => {
        selectedAction = (e.target as HTMLInputElement).value as ManualAction;
        updateFormView();
    })
);

document.querySelectorAll<HTMLInputElement>('input[name="model"]').forEach(radio =>
    radio.addEventListener('change', e => {
        selectedModel = (e.target as HTMLInputElement).value as ManualModelName;
        updateFormView();
    })
);

function updateFormView(): void {
    const selectDiv = document.getElementById('object-select')!;
    const selectInput = document.getElementById('target-id') as HTMLSelectElement;
    const fieldDiv = document.getElementById('dynamic-fields')!;
    fieldDiv.innerHTML = '';

    if (!selectedAction || !selectedModel) return;

    const fields = fieldTemplates[selectedModel];

    if (selectedAction === 'add') {
        selectDiv.style.display = 'none';
        renderFields(fields, {});
    } else {
        selectDiv.style.display = 'block';
        selectInput.innerHTML = '';
        const options = modelMap[selectedModel];

        for (const [id, name] of Object.entries(options)) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = `ID ${id}: ${name}`;
            selectInput.appendChild(opt);
        }

        if (selectedAction === 'update') {
            selectInput.addEventListener('change', async () => {
                const res = await fetch(`/api/get-object-data/?model=${selectedModel}&id=${selectInput.value}`);
                const data: ObjectData = await res.json();
                renderFields(fields, data);
            });
            selectInput.dispatchEvent(new Event('change'));
        } else {
            // Delete — no inputs needed
            fieldDiv.innerHTML = '<p>This will delete the selected item.</p>';
        }
    }
}

function renderFields(fields: Record<string, string>, values: ObjectData): void {
    const fieldDiv = document.getElementById('dynamic-fields')!;
    fieldDiv.innerHTML = '';

    for (const [name, html] of Object.entries(fields)) {
        const wrapper = document.createElement('div');

        const label = document.createElement('label');
        label.textContent = name.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

        let fieldHTML = html;
        if (!html.includes('name=')) {
            fieldHTML = html.replace(/(<input|<select|<textarea)/, `$1 name="${name}"`);
        }

        const inputWrapper = document.createElement('div');
        inputWrapper.innerHTML = fieldHTML;

        const value = values[name];
        if (value !== undefined && value !== null) {
            applyFieldValue(inputWrapper, value);
        }

        wrapper.appendChild(label);
        wrapper.appendChild(inputWrapper);
        fieldDiv.appendChild(wrapper);
    }
}

/**
 * Sets the real DOM value/checked state on whichever control renderFields just built.
 *
 * The old approach (string-replacing a literal `value=""` in the raw template HTML before
 * parsing it) never actually worked: Django renders an unbound form field with no `value`
 * attribute at all when there's no initial data, so the string the regex looked for never
 * existed in the template — update forms silently showed blank/default fields instead of
 * the fetched row's data. Operating on the parsed element directly after insertion fixes
 * that for every control type the Manual Edit forms use (text/number/email inputs,
 * checkboxes, selects, textareas).
 */
function applyFieldValue(container: HTMLElement, value: string | number | boolean): void {
    const control = container.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        'input, select, textarea'
    );
    if (!control) return;

    if (control instanceof HTMLInputElement && (control.type === 'checkbox' || control.type === 'radio')) {
        control.checked = value === true || value === 'true' || value === 'True';
    } else {
        control.value = String(value);
    }
}
