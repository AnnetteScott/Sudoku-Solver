import { readFileSync } from 'node:fs';

const path = `./input.txt`;
const inputString = readFileSync(path, { encoding: 'utf-8' }).replaceAll('\r', '').trim();
const map = inputString.split("\n").map(a => {
	const str = a.split('');
	return str.filter(b => b !== '|').map(c => c === '.' ? new Set<number>() : parseInt(c))
})

const allNumbers = Array.from({length: 9}, (a, i) => i + 1);
function getValid(x: number, y: number): Set<number>{
	const output = new Set<number>();
	let validNumbers = allNumbers.filter(a => !map[y].includes(a));
	let vertical = allNumbers.filter(a => !getColumn(x).filter(b => typeof b === 'number').includes(a));
	const box = getBox(x, y).box.flat();

	validNumbers = validNumbers.filter(a => vertical.includes(a));
	validNumbers = validNumbers.filter(a => allNumbers.filter(a => !box.includes(a)).includes(a));

	const point = map[y][x]
	if(typeof point !== 'number' && point.size > 0){
		validNumbers = validNumbers.filter(value => Array.from(point).includes(value));
	}

	validNumbers.forEach(a => output.add(a))
	return output;
}

function getColumn(x: number): (number | Set<number>)[]{
	const output: (number | Set<number>)[] = [];
	for(let i = 0; i < 9; i++){
		output.push(map[i][x]);
	}
	return output;
}

function getBox(x: number, y: number){
	const boxY = Math.floor(y / 3) * 3;
	const boxX = Math.floor(x / 3) * 3;
	return {box: map.slice(boxY, boxY + 3).map(row => row.slice(boxX, boxX + 3)), boxX, boxY};
}

function getCoord(box: (number | Set<number>)[][], number: number){
	let indexX = 0;
	let indexY = 0;
	while(indexY < 3){
		indexX = 0;
		while(indexX < 3){
			const value = box[indexY][indexX];
			if(typeof value !== 'number' && value.has(number)){
				return {x: indexX, y: indexY};
			}
			indexX++;
		}
		indexY++;
	}
}

function fill(){
	const emptySpots: {x: number, y: number}[] = [];
	for(let y = 0; y < 9; y++){
		for(let x = 0; x < 9; x++){
			if(typeof map[y][x] !== 'number' ){
				const result = getValid(x, y);
				if(result.size === 1){
					map[y][x] = result.values().next().value;
				}else {
					emptySpots.push({x, y});
					map[y][x] = result;
				}
			}
		}
	}
	return emptySpots;
}

function checkUniqueBox(x: number, y: number){
	const box = getBox(x, y)
	const seen = new Map<number, number>();
	for(const item of box.box.flat()){
		if(typeof item !== 'number'){
			for(const value of item.values()){
				seen.set(value, (seen.get(value) ?? 0) + 1)
			}
		}
	}
	
	for(let [number, amount] of seen.entries()){
		if(amount === 1){
			const point = getCoord(box.box, number);
			if(point){
				map[point.y + box.boxY][point.x + box.boxX] = number;
			}
		}
	}
}

function checkUniqueCol(x: number, y: number){
	const values = map[y][x];
	if(typeof values === 'number'){
		return;
	}

	for(const number of values.values()){
		const column = getColumn(x);
		for(let i = 0; i < 9; i++){
			if(typeof map[i][x] !== 'number' && i !== y && map[i].includes(number)){
				column[i] = number;
			}
		}
		if(column.filter(a => typeof a !== 'number').length === 1){
			map[y][x] = number;
			return;
		}
	}

}

function checkForPairs(x: number, y: number){
	const box = getBox(x, y);
	for(let i = 0; i < 3; i++){
		for(let j = 0; j < 3; j++){
			const point = box.box[i][j];
			if(typeof point === 'number' || point.size > 2){
				continue;
			}

			const positions: { x: number; y: number }[] = [];
			const values = Array.from(point)
			for(let k = 0; k < 3; k++){
				for(let m = 0; m < 3; m++){
					const compare = box.box[k][m];
					if(typeof compare === 'number' || compare.size > 2){
						continue;
					}
					if(compare.has(values[0]) && compare.has(values[1])){
						positions.push({x: m, y: k})
					}
				}
			}

			if(positions.length === 2){
				for(let k = 0; k < 3; k++){
					for(let m = 0; m < 3; m++){
						const val = map[k + box.boxY][m + box.boxX];
						if(typeof val !== 'number'){
							val.delete(values[0]);
							val.delete(values[1]);
						}
					}
				}
				map[positions[0].y + box.boxY][positions[0].x + box.boxX] = new Set(values);
				map[positions[1].y + box.boxY][positions[1].x + box.boxX] = new Set(values);
			}

		}
	}
	
}

function singles(x: number, y: number){
	const column = getColumn(x);
	const seen = new Map<number, number>();
	for(let i = 0; i < 9; i++){
		const values = column[i];
		if(typeof values === 'number'){
			continue;
		}
		Array.from(values).forEach(num => seen.set(num, (seen.get(num) ?? 0) + 1))
	}

	for(let [number, amount] of seen.entries()){
		if(amount === 1){
			const indices = column.reduce<number[]>((acc, set, index) => {
				if(typeof set !== 'number' && set.has(number)) {
					acc.push(index);
				}
				return acc;
			}, []);
			map[indices[0]][x] = number;
		}
	}
}

function printMap(){
	let result = "";
	map.forEach((row, rowIndex) => {
		if (rowIndex % 3 === 0 && rowIndex !== 0) {
			result += "------+-------+------\n";
		}
		
		row.forEach((num, colIndex) => {
			if (colIndex % 3 === 0 && colIndex !== 0) {
				result += "| ";
			}
			if(typeof num === 'number'){
				result += `${num} `;
			}else {
				result += `. `;
			}
		});
		
		result = result.trimEnd();
		result += "\n";
	});

	console.log(result);
}
printMap();
let previous = Infinity;
let current = 81;
while(previous > current && current > 0){
	previous = current;
	current = fill().length;
	for(let y = 0; y < 9; y += 3){
		for(let x = 0; x < 9; x += 3){
			current = fill().length;
			checkUniqueBox(x, y);
			checkForPairs(x, y);
		}
	}
	for(let y = 0; y < 9; y++){
		for(let x = 0; x < 9; x++){
			current = fill().length;
			checkUniqueCol(x, y);
			singles(x, y);
		}
	}
}

printMap();