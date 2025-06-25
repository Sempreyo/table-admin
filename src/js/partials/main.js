let selection = {
	start: null,
	hovered: null,
	end: null,
	active: false,
	clickCount: 0,
	cells: []
};

const setCellFocus = (cell, parent) => {
	const cells = parent.querySelectorAll("td, th");

	cells.forEach(cell => cell.classList.remove("focused"));
	cell.classList.add("focused");
}

// Событие редактирования ячейки
const setEditableCellEvent = (cell, parent) => {
	cell.addEventListener("click", () => {
		if (!selection.active) { // В обычном режиме
			setCellFocus(cell, parent);
			makeCellEditable(cell);
		} else if (cell.tagName === "TD" || cell.tagName === "TH") { // В режиме объединения/разделения ячеек
			const rowIndex = +cell.dataset.row;
			const columnIndex = +cell.dataset.column;
			const isHeader = cell.tagName === "TH";

			switch (selection.clickCount) {
				case 0:
					selection.start = {rowIndex, columnIndex, isHeader};
					selection.clickCount += 1;
					break;
				case 1:
					if (selection.start.rowIndex !== +cell.dataset.row ||
						selection.start.columnIndex !== +cell.dataset.column
					) {
						selection.clickCount += 1;
						parent.querySelectorAll("td, th").forEach(cell => cell.style.backgroundColor = "");
						selection.end = {rowIndex, columnIndex};
						joinCells(parent);
					} else {
						alert("Выделите вторую ячейку для объединения");
					}
					break;
			}
		}
	});
}

// Выделение ячеек при объединении/разделении
const updateSelectionHandler = (table, cell) => {
	// Сбрасываем выделение
	table.querySelectorAll("td, th").forEach(cell => cell.classList.remove("selection"));

	const rowIndex = +cell.dataset.row;
	const columnIndex = +cell.dataset.column;
	const isHeader = cell.tagName === "TH";

	selection.hovered = {rowIndex, columnIndex, isHeader};
	selection.cells = [cell];

	if (!selection.start || !selection.hovered || selection.clickCount > 1) return;

	const startRow = Math.min(selection.start.rowIndex, selection.hovered.rowIndex);
	const endRow = Math.max(selection.start.rowIndex, selection.hovered.rowIndex);
	const startColumn = Math.min(selection.start.columnIndex, selection.hovered.columnIndex);
	const endColumn = Math.max(selection.start.columnIndex, selection.hovered.columnIndex);

	selection.cells = [];
	const rows = selection.start.isHeader ?
		table.querySelector("thead").rows :
		table.querySelector("tbody").rows;

	for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
		const row = rows[rowIndex];
		if (!row) continue;

		for (let columnIndex = startColumn; columnIndex <= endColumn; columnIndex++) {
			const cellSelected = row.cells[columnIndex];

			if (cellSelected) {
				cellSelected.classList.add("selection");
				selection.cells.push(cell);
			}
		}
	}
}

// Объединение ячеек
const joinCells = (table) => {
	const startRow = Math.min(selection.start.rowIndex, selection.end.rowIndex);
	const endRow = selection.start.isHeader ?
		0 :
		Math.max(selection.start.rowIndex, selection.end.rowIndex);
	const startColumn = Math.min(selection.start.columnIndex, selection.end.columnIndex);
	const endColumn = Math.max(selection.start.columnIndex, selection.end.columnIndex);

	const rows = selection.start.isHeader ?
		table.querySelector("thead").rows :
		table.querySelector("tbody").rows;
	const cellFirst = rows[startRow].cells[startColumn]; // Первая выделенная ячейка
	const cellFirstValue = cellFirst.textContent; // Значение первой выделенной ячейки

	for (let row = startRow; row <= endRow; row++) {
		for (let column = startColumn; column <= endColumn; column++) {
			if (row === startRow && column === startColumn) continue; // Пропускаем первую ячейку, остальные прячем

			const cell = rows[row].cells[column];
			cell.setAttribute("hidden", "true");
			cell.setAttribute("data-merged", "true");
			cell.setAttribute("data-merged-with", `${startRow}, ${startColumn}`);
		}
	}

	cellFirst.rowSpan = endRow - startRow + 1;
	cellFirst.colSpan = endColumn - startColumn + 1;
	cellFirst.textContent = cellFirstValue;
	cellFirst.setAttribute("data-merged-main", "true");

	resetSelection();
}

// Разделение ячеек
const splitCells = (table) => {
	const focusedCell = table.querySelector(".focused[data-merged-main]");

	if (focusedCell) {
		const mergedCells = table.querySelectorAll(`[data-merged-with="${focusedCell.dataset.row}, ${focusedCell.dataset.column}"]`);

		// Сбрасываем colspan и rowspan у выделенной ячейки
		focusedCell.removeAttribute("colspan");
		focusedCell.removeAttribute("rowspan");
		focusedCell.removeAttribute("data-merged-main");

		// Показываем скрытые ячейки
		mergedCells.forEach(cell => {
			cell.removeAttribute("hidden");
			cell.removeAttribute("data-merged");
			cell.removeAttribute("data-merged-with");
		});

		resetSelection();
	}
}

const createTable = (parent, rowsInput, columnsInput, menuCreate, menuPanel) => {
	const rows = +rowsInput.value;
	const columns = +columnsInput.value;
	const table = document.createElement("table"); // Элемент таблицы
	const thead = document.createElement("thead"); // Заголовок таблицы
	const headerRow = document.createElement("tr"); // Строка для заголовка таблицы
	const tbody = document.createElement("tbody"); // Тело таблицы

	if (isNaN(rows) || isNaN(columns) || rows < 1 || columns < 1) {
		alert("Введите правильное количество строк и столбцов от 1");
		return;
	}

	parent.innerHTML = "";

	// Создание заголовка таблицы thead
	for (let cell = 0; cell < columns; cell++) {
		const th = document.createElement("th");

		th.textContent = `Заголовок ${cell+1}`;
		//th.addEventListener("click", sortTable(i));

		th.dataset.row = "0";
		th.dataset.column = cell.toString();
		th.dataset.type = "th";
		headerRow.append(th);

		setEditableCellEvent(th, parent);

		th.addEventListener("mouseenter", (e) => updateSelectionHandler(parent, e.target));
	}

	thead.append(headerRow);
	table.append(thead);

	// Создание тела таблицы tbody
	for (let row = 0; row < rows - 1; row++) {
		const tr = document.createElement("tr");

		for (let cell = 0; cell < columns; cell++) {
			const td = document.createElement("td");

			// Добавляем фокус первой ячейке в первой строке
			if (row === 0 && cell === 0) {
				setCellFocus(td, parent);
			}

			td.textContent = `Строка ${row+1}, Ячейка ${cell+1}`;
			td.dataset.row = row.toString();
			td.dataset.column = cell.toString();
			tr.append(td);

			setEditableCellEvent(td, parent);

			td.addEventListener("mouseenter", (e) => updateSelectionHandler(parent, e.target));
		}

		tbody.append(tr);
	}

	table.append(tbody);
	parent.append(table);

	menuCreate.setAttribute("hidden", true);
	menuPanel.removeAttribute("hidden");
}

const makeCellEditable = (td) => {
	const currentText = td.innerHTML;
	td.textContent = "";

	const input = document.createElement("input");
	input.type = "text";
	input.value = currentText;

	td.append(input);
	input.focus();

	const finishEditing = () => {
		td.innerHTML = input.value;
	}

	input.addEventListener("blur", finishEditing);

	input.addEventListener("click", (e) => {
		e.stopPropagation();
	});

	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			finishEditing();
		}
	});
}

const recalculateRowColumnIndex = (table) => {
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll("td");

        cells.forEach((cell, cellIndex) => {
            cell.dataset.row = rowIndex.toString();
            cell.dataset.column = cellIndex.toString();
        });
    });
}

const createRowHandler = (table) => {
	const focusedCell = table.querySelector(".focused");

	if (focusedCell) {
		const row = focusedCell.closest("tr");
		const newRow = document.createElement("tr");

		[...row.children].forEach(() => {
			const td = document.createElement("td");

			setEditableCellEvent(td, table);

			newRow.append(td);
		})

		row.insertAdjacentElement("afterend", newRow);

		recalculateRowColumnIndex(table);
	}
}

const removeRowHandler = (table) => {
	const focusedCell = table.querySelector(".focused");

	if (focusedCell) {
		const row = focusedCell.closest("tr");
		row.remove();
		recalculateRowColumnIndex(table);
	}
}

const createColumnHandler = (table) => {
	const focusedCellIndex = table.querySelector(".focused").cellIndex;

	table.querySelectorAll("tr").forEach(tr => {
		const cellSelected = tr.querySelectorAll("td, th")[focusedCellIndex];
		const newCell = cellSelected.tagName === "TD" ?
			document.createElement("td") :
			document.createElement("th");

		setEditableCellEvent(newCell, table);

		cellSelected.insertAdjacentElement("afterend", newCell);
	});

	recalculateRowColumnIndex(table);
}

const removeColumnHandler = (table) => {
	const focusedCellIndex = table.querySelector(".focused").cellIndex;

	table.querySelectorAll("tr").forEach(tr => {
		const cellSelected = tr.querySelectorAll("td, th")[focusedCellIndex];
		cellSelected.remove();
	});

	recalculateRowColumnIndex(table);
}

// Редактирование текста ячейки
const editText = (focusedCell, button) => {
	const action = button.dataset.edit;

	if (focusedCell) {
		const style = focusedCell.style;

		switch (action) {
			case "bold":
				style.fontWeight = "700";
				break;
			case "italic":
				style.fontStyle = "italic";
				break;
			case "horizontal-left":
				style.textAlign = "left";
				break;
			case "horizontal-center":
				style.textAlign = "center";
				break;
			case "horizontal-right":
				style.textAlign = "right";
				break;
			case "remove-edit":
				focusedCell.removeAttribute("style");
				break;
		}
	}
}

const toggleDropdown = (forms, form, event) => {
	if (form) {
		event.stopPropagation();
		forms.forEach(el => el.setAttribute("hidden", "true"));
		form.removeAttribute("hidden");
	}
}

const dropdownSubmitHandler = (table, form, event, dropdownType) => {
	event.preventDefault();
	const focusedCell = table.querySelector(".focused");

	switch (dropdownType) {
		case "link":
			const textFieldValue = form.querySelector('[name="link-text"]').value;

			if (textFieldValue !== "" && focusedCell) {
				const linkFieldValue = form.querySelector('[name="link"]').value;
				const isBlank = form.querySelector('[name="link-target"]').value;
				let linkEl = document.createElement("a");

				linkEl.textContent = textFieldValue;

				if (linkFieldValue) {
					linkEl.setAttribute("href", linkFieldValue);
				}

				if (isBlank) {
					linkEl.setAttribute("target", "_blank");
				}

				focusedCell.append(linkEl);
			}
			break;
		case "color":
			const colorFieldValue = form.querySelector('[name="color"]').value;
			const applyTo = form.querySelector('[name="apply-to"]:checked').value;

			switch (applyTo) {
				case "cell":
					focusedCell.style.backgroundColor = colorFieldValue;
					break;
				case "row":
					focusedCell.parentElement.querySelectorAll("td, th").forEach(cell => cell.style.backgroundColor = colorFieldValue);
					break;
				case "column":
					table.querySelectorAll("tr").forEach(tr => tr.cells[focusedCell.cellIndex].style.backgroundColor = colorFieldValue);
					break;
			}
			break;
		case "width":
			const widthFieldValue = form.querySelector('[name="width"]').value;

			table.querySelectorAll("tr").forEach(tr => {
				const cellSelected = tr.querySelectorAll("td, th")[focusedCell.cellIndex];

				cellSelected.setAttribute("width", widthFieldValue);
			});
			break;
	}
	form.setAttribute("hidden", "true");
}

const exportToXLSX = (table, filename) => {
	if (table) {
		// Создаем клон таблицы без скрытых объединением ячеек
		const tableClone = table.cloneNode(true);
		const rows = tableClone.querySelectorAll("tr");

		rows.forEach(row => {
			const cells = row.querySelectorAll("td, th");

			cells.forEach(cell => {
				if (cell.hasAttribute("hidden")) {
					cell.remove();
				}
			});
		});

		// Преобразуем таблицу в книгу Excel и пишем в файл
		const book = XLSX.utils.table_to_book(tableClone);
		XLSX.writeFile(book, filename);
	}
}

const importFromXLSX = (table, target) => {
	if (!table) return;

	// Добавляем события ячейкам импортированной таблицы
	const setEventsToImportedTable = (cell, rowIndex, columnIndex) => {
		if (rowIndex === 1 && columnIndex === 0) {
			setCellFocus(cell, table);
		}

		if (rowIndex === 0) {
			cell.dataset.type = "th";
			cell.dataset.row = "0";
		} else {
			cell.dataset.row = `${rowIndex - 1}`;
		}
		cell.dataset.column = columnIndex.toString();

		setEditableCellEvent(cell, table);
		cell.addEventListener("mouseenter", (e) => updateSelectionHandler(table, e.target));
	}

	const file = target.files[0];
	const errorMessage = target.nextElementSibling;

	if (!file) {
		errorMessage.textContent = "Файл не выбран";
		errorMessage.removeAttribute("hidden");
		return;
	} else {
		errorMessage.setAttribute("hidden", "true");
	}

	const reader = new FileReader();

	reader.onload = (e) => {
		const data = new Uint8Array(e.target.result);
		const book = XLSX.read(data, {type: "array"});

		// Получаем данные из первого листа
		const firstSheetName = book.SheetNames[0];
		const sheet = book.Sheets[firstSheetName];
		const jsonData = XLSX.utils.sheet_to_json(sheet, {header: 1});

		// Получаем данные об объединенных ячейках
		const merges = sheet["!merges"] || [];
		const mergeObj = {};

		// Формируем объект объединенных ячеек
		merges.forEach(merge => {
			const mainKey = `${merge.s.r},${merge.s.c}`;

			mergeObj[mainKey] = {
				rowspan: merge.e.r - merge.s.r + 1,
				colspan: merge.e.c - merge.s.c + 1,
				hiddenCells: []
			}

			for (let r = merge.s.r; r <= merge.e.r; r++) {
				for (let c = merge.s.c; c <= merge.e.c; c++) {
					if (r !== merge.s.r || c !== merge.s.c) {
						mergeObj[mainKey].hiddenCells.push(`${r},${c}`);
					}
				}
			}
		});

		// Заменяем содержимое таблицы
		table.innerHTML = "";

		if (!jsonData || jsonData.length === 0) return;

		resetSelection();

		const thead = document.createElement("thead");
		const tbody = document.createElement("tbody");

		// Находим максимальную длину строки
		const maxCellsLength = jsonData.find(arr => arr.length === Math.max(...jsonData.map(data => data.length))).length;

		jsonData.forEach((rowData, rowIndex) => { // Перебор строк
			const row = document.createElement("tr");

			for (let columnIndex = 0; columnIndex < maxCellsLength; columnIndex++) { // Перебор ячеек с строке
				const cellData = (rowData || [])[columnIndex];
				const cellKey = `${rowIndex},${columnIndex}`;
				let isMainCell = false;

				// Проверяем главную для объединения ячейку
				for (const key in mergeObj) {
					if (cellKey === key) {
						isMainCell = true;
						break;
					}
				}

				// Создаем главную для объединения ячейку
				if ((cellData !== undefined) && (cellData !== null)) {
					const cell = document.createElement(rowIndex === 0 ? "th" : "td");
					cell.textContent = cellData.toString();

					if (isMainCell) {
						cell.rowSpan = mergeObj[cellKey].rowspan;
						cell.colSpan = mergeObj[cellKey].colspan;
						cell.setAttribute("data-merged-main", "true");
						row.append(cell);
					} else {
						row.append(cell);
					}

					setEventsToImportedTable(cell, rowIndex, columnIndex);
				} else {
					const hiddenCell = document.createElement(rowIndex === 0 ? "th" : "td");
					hiddenCell.setAttribute("data-merged", "true");

					// Находим индекс строки и столбца главной ячейки, к которой относится скрытая
					const searchMergedCell = Object.keys(mergeObj).find(key => mergeObj[key.toString()].hiddenCells.includes(cellKey));

					hiddenCell.setAttribute(
						"data-merged-with",
						`${(rowIndex === 0) ? searchMergedCell.split(",")[0] : searchMergedCell.split(",")[0] - 1}, ${searchMergedCell.split(",")[1]}`
					);
					hiddenCell.setAttribute("hidden", "true");
					row.append(hiddenCell);

					setEventsToImportedTable(hiddenCell, rowIndex, columnIndex);
				}
			}

			(rowIndex === 0) ? thead.append(row) : tbody.append(row);
		});

		table.append(thead);
		table.append(tbody);
	};

	reader.readAsArrayBuffer(file);
}

const resetSelection = () => {
	selection = {
		start: null,
		hovered: null,
		end: null,
		active: false,
		clickCount: 0
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const container = document.querySelector(".table__wrapper");
	let table = null;
	const menuCreateTable = document.querySelector(".table__create");
	const menuPanel = document.querySelector(".table__panel");
	const rowsInput = menuCreateTable.querySelector(".table__num-rows");
	const columnsInput = menuCreateTable.querySelector(".table__num-columns");
	const createButton = menuCreateTable.querySelector(".js-create-table");
	const addRowButton = menuPanel.querySelector(".js-create-row");
	const addColumnButton = menuPanel.querySelector(".js-create-column");
	const removeRowButton = menuPanel.querySelector(".js-remove-row");
	const removeColumnButton = menuPanel.querySelector(".js-remove-column");
	const joinCellsButton = menuPanel.querySelector(".js-join-cells");
	const splitCellsButton = menuPanel.querySelector(".js-split-cells");
	const editButtons = menuPanel.querySelectorAll(".js-edit");
	const dropButtons = menuPanel.querySelectorAll('[data-dropdown]');
	const dropdowns = menuPanel.querySelectorAll(".table__dropdown");
	const importField = menuPanel.querySelector(".js-import");
	const exportButton = menuPanel.querySelector(".js-export");

	// На всех кнопках сбрасываем стандартное поведение
	menuPanel.querySelectorAll("button").forEach(button => {
		button.addEventListener("click", (e) => {
			e.preventDefault();
		});
	});

	createButton.addEventListener("click", (e) => {
		e.preventDefault();
		createTable(container, rowsInput, columnsInput, menuCreateTable, menuPanel);
		table = container.querySelector(".table__wrapper table");
	});

	addRowButton.addEventListener("click", () => createRowHandler(table));
	addColumnButton.addEventListener("click", () => createColumnHandler(table));
	removeRowButton.addEventListener("click", () => removeRowHandler(table));
	removeColumnButton.addEventListener("click", () => removeColumnHandler(table));
	joinCellsButton.addEventListener("click", () => {
		selection.active = true;
	});
	splitCellsButton.addEventListener("click", () => splitCells(table));
	editButtons.forEach(button => {
		button.addEventListener("click", () => editText(table.querySelector(".focused"), button));
	});
	dropButtons.forEach(button => {
		const dropdown = button.nextElementSibling;
		const submit = dropdown.querySelector(".js-dropdown-submit");

		button.addEventListener("click", (e) => toggleDropdown(dropdowns, dropdown, e));
		submit.addEventListener("click", (e) => dropdownSubmitHandler(table, dropdown, e, button.dataset.dropdown));
	});
	exportButton.addEventListener("click", () => {
		// Имя в формате import_DD_MM_YYYY.xlsx
		exportToXLSX(
			table, 
			`import_${((new Date()).getDate()).toString().padStart(2, '0')}_${((new Date()).getMonth() + 1).toString().padStart(2, '0')}_${(new Date()).getFullYear()}.xlsx`
		);
	});
	importField.addEventListener("change", (e) => importFromXLSX(table, e.target));

	// Клик вне элемента - закрываем его
	document.addEventListener("click", (e) => {
		dropButtons.forEach(button => {
			const dropdown = button.nextElementSibling;

			if (dropdown && !dropdown.hasAttribute("hidden") && !dropdown.contains(e.target) && e.target !== dropdown) {
				dropdown.setAttribute("hidden", "true");
			}
		});
	});
});
