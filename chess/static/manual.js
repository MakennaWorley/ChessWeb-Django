let selectedAction = null;
let selectedModel = null;

document.querySelectorAll('input[name="action"]').forEach(radio =>
    radio.addEventListener('change', e => {
        selectedAction = e.target.value;
        updateFormView();
    })
);

document.querySelectorAll('input[name="model"]').forEach(radio =>
    radio.addEventListener('change', e => {
        selectedModel = e.target.value;
        updateFormView();
    })
);

function updateFormView() {
    const selectDiv = document.getElementById('object-select');
    const selectInput = document.getElementById('target-id');
    const fieldDiv = document.getElementById('dynamic-fields');
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
                const data = await res.json();
                renderFields(fields, data);
            });
            selectInput.dispatchEvent(new Event('change'));
        } else {
            // Delete — no inputs needed
            fieldDiv.innerHTML = '<p>This will delete the selected item.</p>';
        }
    }
}

function renderFields(fields, values) {
    const fieldDiv = document.getElementById('dynamic-fields');
    fieldDiv.innerHTML = '';

    for (const [name, html] of Object.entries(fields)) {
        const wrapper = document.createElement('div');

        const label = document.createElement('label');
        label.textContent = name.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

        let fieldHTML = html;
        if (!html.includes('name=')) {
            fieldHTML = html.replace(/(<input|<select|<textarea)/, `$1 name="${name}"`);
        }

        const value = values[name];
        if (value !== undefined && value !== null) {
            fieldHTML = fieldHTML.replace(/value=""/, `value="${value}"`);
        }

        const inputWrapper = document.createElement('div');
        inputWrapper.innerHTML = fieldHTML;

        wrapper.appendChild(label);
        wrapper.appendChild(inputWrapper);
        fieldDiv.appendChild(wrapper);
    }
}