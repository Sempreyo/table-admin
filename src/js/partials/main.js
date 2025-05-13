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
	}

	thead.append(headerRow);
	table.append(thead);

	// Создание тела таблицы tbody
	for (let row = 0; row < rows - 1; row++) {
		const tr = document.createElement("tr");

		for (let cell = 0; cell < columns; cell++) {
			const td = document.createElement("td");

			td.textContent = `Строка ${row+1}, Ячейка ${cell+1}`;
			td.dataset.row = row.toString();
			td.dataset.column = cell.toString();
			tr.append(td);
		}

		tbody.append(tr);
	}

	table.append(tbody);
	parent.append(table);

	menuCreate.setAttribute("hidden", true);
	menuPanel.removeAttribute("hidden");
}

const setCursorCell = () => {
	document.body.classList.add("cursor-cell");
}

const removeCursorCell = () => {
	document.body.classList.remove("cursor-cell");
}

const createRow = () => {
	const table = document.querySelector(".table__wrapper table");
	const tr = table.querySelectorAll("tbody tr");

	setCursorCell();

	tr.forEach(el => el.classList.add("selected"));

	const trSelected = table.querySelectorAll(".selected");

	trSelected.forEach(el => {
		el.addEventListener("click", (e) => {
			[...e.currentTarget.children].forEach(el => {
				console.log(el);
			});

			if (e.currentTarget) {
				e.currentTarget.insertAdjacentHTML("afterend", `<tr>${[...e.currentTarget.children].map(() => "<td></td>").join("")}</tr>`);
			}
		});
	});
}

const createColumn = (table) => {

}

document.addEventListener("DOMContentLoaded", () => {
	const menuCreateTable = document.querySelector(".table__create");
	const menuPanel = document.querySelector(".table__panel");
	const container = document.querySelector(".table__wrapper");
	const rowsInput = menuCreateTable.querySelector(".table__num-rows");
	const columnsInput = menuCreateTable.querySelector(".table__num-columns");
	const createButton = menuCreateTable.querySelector(".js-create-table");
	const addRowButton = menuPanel.querySelector(".js-create-row");
	const addColumnButton = menuPanel.querySelector(".js-create-column");

	createButton.addEventListener("click", () => createTable(container, rowsInput, columnsInput, menuCreateTable, menuPanel));

	addRowButton.addEventListener("click", createRow);
});
