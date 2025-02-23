import { readFileSync } from 'node:fs';

class Point {
	x: number;
	y: number;
	value: number | Set<number>;

	constructor(x: number, y: number, value: number | Set<number>){
		this.x = x;
		this.y = y;
		this.value = value;
	}

	equals(point: Point){
		return this.y === point.y && this.x === point.x;
	}
}

const path = `./input.txt`;
const inputString = readFileSync(path, { encoding: 'utf-8' }).replaceAll('\r', '').trim();
const tempMap = inputString.split("\n").map(a => {
	const str = a.split('');
	return str.map(c => c === '.' ? new Set<number>() : parseInt(c))
})
const map: Point[][] = []
const allNumbers = Array.from({length: 9}, (a, i) => i + 1);

for(let y = 0; y < 9; y++){
	map.push([])
	for(let x = 0; x < 9; x++){
		const point = new Point(x, y, tempMap[y][x])
		map[y].push(point);
	}
}


function getNotes(point: Point){
	if(typeof point.value === 'number'){
		return;
	}

	let validNumbers = allNumbers.filter(a => !map[point.y].map(b => b.value).includes(a));
	const vertical = allNumbers.filter(a => !getColumn(point.x).map(b => b.value).includes(a));
	const box = getBox(point).box.flat().filter(a => typeof a.value === 'number').map(b => b.value);
	validNumbers = validNumbers.filter(a => vertical.includes(a)).filter(a => !box.includes(a));
	const values = Array.from(point.value)
	point.value = new Set(validNumbers.filter(value => values.length > 0 ? values.includes(value) : true));
	if(point.value.size !== values.length){
		changed = true;
	}
}

function getColumn(x: number): Point[]{
	const output: Point[] = [];
	for(let i = 0; i < 9; i++){
		output.push(map[i][x]);
	}
	return output;
}

function getBox(point: Point){
	const boxY = Math.floor(point.y / 3) * 3;
	const boxX = Math.floor(point.x / 3) * 3;
	return {box: map.slice(boxY, boxY + 3).map(row => row.slice(boxX, boxX + 3)), boxX, boxY};
}

function uniqueBox(point: Point){
	const box = getBox(point);
	const values = box.box.flat().filter(a => typeof a.value !== 'number')
	const seen = checkSeen(point, values);
	const pairs: number[] = [];
	for(const [num, total] of seen?.entries()){
		if(total === 2){
			pairs.push(num)
		}
	}
	if(pairs.length === 2){
		const points: Point[] = []
		for(const pointObj of values){
			if(pointObj.value instanceof Set && pointObj.value.has(pairs[0]) && pointObj.value.has(pairs[1])){
				points.push(pointObj)
			}
		}
		if(points.length === 2){
			points.forEach(p => {
				if(typeof p.value !== 'number' && p.value.size > 2){
					changed = true;
				}
				p.value = new Set(pairs)
			})
		}
	}
}

function uniqueColumn(point: Point){
	const column = getColumn(point.x);
	const values = column.filter(a => typeof a.value !== 'number')
	checkSeen(point, values);
}

function uniqueRow(point: Point){
	const row = map[point.y];
	const values = row.filter(a => typeof a.value !== 'number')
	checkSeen(point, values);
}

function checkSeen(point: Point, points: Point[]){
	const seen = new Map<number, number>();
	if(typeof point.value === 'number'){
		return seen;
	}
	for(const num of point.value){
		for(const set of points){
			if(set.value instanceof Set && set.value.has(num)){
				seen.set(num, (seen.get(num) ?? 0) + 1)
			}
		}
	}

	for(let [number, amount] of seen.entries()){
		if(amount === 1){
			changed = true;
			point.value = number;
		}
	}

	return seen;
}

function pointingPairs(point: Point){
	if(typeof point.value === 'number'){
		return;
	}
	const column = getColumn(point.x);
	const row = map[point.y];
	const box = getBox(point).box.flat().filter(a =>  a.value instanceof Set);
	for(const num of point.value){
		const points: Point[] = [];
		for(const val of box){
			if(val.value instanceof Set && val.value.has(num)){
				points.push(val)
			}
		}

		
		const x = new Set(points.map(a => a.x));
		if(x.size === 1){
			const outside = column.filter(p1 => !box.some(p2 => p1.equals(p2))).filter(a => typeof a.value !== 'number');
			for(const set of outside){
				if(set.value instanceof Set){
					set.value.delete(num);
				}
			}
		}
	}
}

function fill(){
	for(let y = 0; y < 9; y++){
		for(let x = 0; x < 9; x++){
			getNotes(map[y][x]);
			const val = map[y][x].value;
			if(typeof val !== 'number' ){
				if(val.size === 1){
					changed = true;
					map[y][x].value = val.values().next().value;
				}
			}
		}
	}
}


function loop(callback: (point: Point) => void){
	for(let y = 0; y < 9; y++){
		for(let x = 0; x < 9; x++){
			callback(map[y][x])
		}
	}
}

let changed = true;
while(changed){
	changed = false;
	loop(getNotes)
	loop(uniqueBox)
	loop(getNotes)
	loop(uniqueColumn)
	loop(getNotes)
	loop(uniqueRow)
	loop(getNotes)
	loop(pointingPairs)
	loop(getNotes)
	loop(fill)
}


printMap()
console.dir(map, {depth: null});

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
			if(typeof num.value === 'number'){
				result += `${num.value} `;
			}else {
				result += `. `;
			}
		});
		
		result = result.trimEnd();
		result += "\n";
	});

	process.stdout.write(result);
}

