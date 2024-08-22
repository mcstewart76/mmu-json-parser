document.addEventListener('DOMContentLoaded', function () {
    const dropZone = document.getElementById('dropZone');
    const output = document.getElementById('output');

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragging');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragging');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragging');

        const files = e.dataTransfer.files;
        if (files.length) {
            const file = files[0];
            if (file.type === 'application/json') {
                const reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        const json = JSON.parse(e.target.result);
                        displayAttributes(json);
                    } catch (error) {
                        output.innerHTML = 'Error parsing JSON file';
                    }
                };
                reader.readAsText(file);
            } else {
                output.innerHTML = 'Please drop a valid JSON file';
            }
        }
    });

    function displayAttributes(jsonObject) {
        output.innerHTML = '<h3>Attributes:</h3>';
        const ul = document.createElement('ul');
        for (const key in jsonObject) {
            if (jsonObject.hasOwnProperty(key)) {
                const li = document.createElement('li');
                li.textContent = key;
                ul.appendChild(li);
            }
        }
        output.appendChild(ul);
    }
});
