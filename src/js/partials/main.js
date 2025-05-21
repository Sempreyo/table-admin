let selection = {
	start: null,
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
		if (selection.active) { // В обычном режиме
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
						parent.querySelectorAll("td").forEach(td => td.style.backgroundColor = "");
						selection.end = {rowIndex, columnIndex};
						joinCells(parent);
					} else {
						alert("Выделите вторую ячейку для объединения");
					}
					break;
			}

			console.log(selection);

			//resetSelection();
		}
	});
}

// Выделение ячеек при объединении/разделении ячеек
const updateSelectionHandler = (table, td) => {
	if (td.tagName !== "TD") return;

	const rowIndex = +td.dataset.row;
	const columnIndex = +td.dataset.column;

	selection.end = {rowIndex, columnIndex};

	table.querySelectorAll("td").forEach(td => td.style.backgroundColor = "");

	if (!selection.start || !selection.end || selection.clickCount > 1) return;

	const startRow = Math.min(selection.start.rowIndex, selection.end.rowIndex);
	const endRow = Math.max(selection.start.rowIndex, selection.end.rowIndex);
	const startColumn = Math.min(selection.start.columnIndex, selection.end.columnIndex);
	const endColumn = Math.max(selection.start.columnIndex, selection.end.columnIndex);
	
	for (let row = startRow; row <= endRow; row++) {
		for (let column = startColumn; column <= endColumn; column++) {
			const td = table.querySelector(`td[data-row="${row}"][data-column="${column}"]`);

			if (td) {
				td.style.backgroundColor = "red";
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

	console.log(selection);
	
	for (let row = startRow; row <= endRow; row++) {
		for (let column = startColumn; column <= endColumn; column++) {
			const td = table.querySelector(`td[data-row="${row}"][data-column="${column}"]`);

			if (column > startColumn) {
				td.remove();
			} else {
				td.setAttribute("colspan", endColumn);
			}

			if (row > startRow) {
				td.remove();
			} else {
				td.setAttribute("rowspan", endRow);
			}
		}
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
		headerRow.append(th);

		setEditableCellEvent(th, parent);
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
	const currentText = td.innerHTML;

	td.innerHTML = `<input type="text" value="${currentText}" style="width: 100%;">`;

	const input = td.querySelector("input");
	input.focus();

	input.addEventListener("blur", () => {
		td.innerHTML = input.value;
	});

	input.addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
			input.blur();
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

		addRowButton.addEventListener("click", (e) => createRowHandler(table));
		addColumnButton.addEventListener("click", (e) => createColumnHandler(table));
	});
});
