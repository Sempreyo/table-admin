let selection = {
	start: null,
	hovered: null,
	end: null,
	active: false,
	clickCount: 0
};

const setCellFocus = (td, parent) => {
	const cells = parent.querySelectorAll("td, th");

	cells.forEach(cell => cell.classList.remove("focused"));
	td.classList.add("focused");
}

// Событие редактирования ячейки
const setEditableCellEvent = (cell, parent) => {
	cell.addEventListener("click", () => {
		if (!selection.active) { // В обычном режиме
			setCellFocus(cell, parent);
			makeCellEditable(cell);
		} else if (cell.tagName === "TD") { // В режиме объединения/разделения ячеек
			const rowIndex = +cell.dataset.row;
			const columnIndex = +cell.dataset.column;

			switch (selection.clickCount) {
				case 0:
					selection.start = {rowIndex, columnIndex};
					selection.clickCount += 1;
					break;
				case 1:
					if (selection.start.rowIndex !== +cell.dataset.row ||
						selection.start.columnIndex !== +cell.dataset.column
					) {
						selection.clickCount += 1;
						parent.querySelectorAll("td").forEach(cell => cell.style.backgroundColor = "");
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
	if (cell.tagName !== "TD") return;

	const rowIndex = +cell.dataset.row;
	const columnIndex = +cell.dataset.column;

	selection.hovered = {rowIndex, columnIndex};

	table.querySelectorAll("td").forEach(cell => cell.style.backgroundColor = "");

	if (!selection.start || !selection.hovered || selection.clickCount > 1) return;

	const startRow = Math.min(selection.start.rowIndex, selection.hovered.rowIndex);
	const endRow = Math.max(selection.start.rowIndex, selection.hovered.rowIndex);
	const startColumn = Math.min(selection.start.columnIndex, selection.hovered.columnIndex);
	const endColumn = Math.max(selection.start.columnIndex, selection.hovered.columnIndex);
	
	for (let row = startRow; row <= endRow; row++) {
		for (let column = startColumn; column <= endColumn; column++) {
			const cellSelected = table.querySelector(`td[data-row="${row}"][data-column="${column}"]`);

			if (cellSelected) {
				cellSelected.style.backgroundColor = "#a2ddfa";
			}
		}
	}
}

// Объединение ячеек
const joinCells = (table) => {
	const startRow = Math.min(selection.start.rowIndex, selection.end.rowIndex);
	const endRow = Math.max(selection.start.rowIndex, selection.end.rowIndex);
	const startColumn = Math.min(selection.start.columnIndex, selection.end.columnIndex);
	const endColumn = Math.max(selection.start.columnIndex, selection.end.columnIndex);

	const rows = table.querySelectorAll("tbody tr");
	const tdFirst = rows[startRow].cells[startColumn]; // Первая выделенная ячейка
	const tdFirstValue = tdFirst.textContent; // Значение первой выделенной ячейки

	for (let row = startRow; row <= endRow; row++) {
		for (let column = startColumn; column <= endColumn; column++) {
			if (row === startRow && column === startColumn) continue; // Пропускаем первую ячейку, остальные прячем

			const td = rows[row].cells[column];
			td.setAttribute("hidden", "true");
			td.setAttribute("data-merged", "true");
			td.setAttribute("data-merged-with", `${startRow}, ${startColumn}`);
		}
	}

	tdFirst.rowSpan = endRow - startRow + 1;
	tdFirst.colSpan = endColumn - startColumn + 1;
	tdFirst.textContent = tdFirstValue;
	tdFirst.setAttribute("data-merged-main", "true");

	resetSelection();
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

	// Создание событий
	/*const newTable = parent.querySelector("table");

	newTable.addEventListener("click", (e) => {

	});*/
}

const makeCellEditable = (td) => {
	const currentText = td.textContent;
	td.textContent = "";

	const input = document.createElement("input");
	input.type = "text";
	input.value = currentText;

	td.append(input);
	input.focus();

	const finishEditing = () => {
		td.textContent = input.value;
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
	const joinCellsButton = menuPanel.querySelector(".js-join-cells");

	createButton.addEventListener("click", () => {
		createTable(container, rowsInput, columnsInput, menuCreateTable, menuPanel);
		table = container.querySelector(".table__wrapper table");
	});

	addRowButton.addEventListener("click", () => createRowHandler(table));
	addColumnButton.addEventListener("click", () => createColumnHandler(table));
	joinCellsButton.addEventListener("click", () => {
		selection.active = true;
	});
});
