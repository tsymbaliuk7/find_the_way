import {Component, OnInit} from '@angular/core';
import {find} from 'rxjs/operators';
import {Title} from '@angular/platform-browser';


// tslint:disable-next-line:typedef
function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}


// tslint:disable-next-line:typedef
function randomInteger(min, max) {
  // получить случайное число от (min-0.5) до (max+0.5)
  let rand = min - 0.5 + Math.random() * (max - min + 1);
  return Math.round(rand);
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  targetPosition = 2;
  gamma = 0.8;
  epsilon = 0.8;
  searcherPosition = 34;
  rectangles: number[][];
  walls = [6, 7, 9, 11, 14, 19, 20, 21, 22, 29, 31, 32];
  possibleRectangles = [];
  width = 5;
  height = 7;
  maxIter = 20000;
  R: number[][];
  Q: number[][];
  isLearned = false;
  isReady = false;

  ngOnInit(): void {
    this.rectangles = [];
    let counter = 0;
    for (let i = 0; i < this.height; i++) {
      this.rectangles[i] = [];
      for (let j = 0; j < this.width; j++) {
        this.rectangles[i][j] = counter;
        counter++;
      }
    }

    this.R = [];
    let neighbors = [];
    let x;
    let y;
    for (let i = 0; i < this.height * this.width; i++) {
      [x, y] = this.getPositionByValue(i, this.rectangles);
      neighbors = this.findingNeighbors(this.rectangles, x, y);
      this.R[i] = [];
      for (let j = 0; j < this.height * this.width; j++) {
        if (this.walls.indexOf(i) !== -1){
          this.R[i].push(-1);
        }
        else if (j !== this.targetPosition) {
          this.R[i].push(neighbors.indexOf(j) !== -1 && this.walls.indexOf(j) === -1 ? 0 : -1);
        }
        else {
          this.R[i].push((neighbors.indexOf(j) !== -1 && this.walls.indexOf(j) === -1) || (i === j) ? 100 : -1);
        }
      }
    }


    this.Q = [];
    for (let i = 0; i < this.height * this.width; i++) {
      this.Q[i] = [];
      for (let j = 0; j < this.height * this.width; j++) {
        this.Q[i][j] = 0;
      }
    }
    this.findingNeighbors(this.rectangles, 3, 2);


    this.possibleRectangles = this.rectangles
      .reduce((acc, val) => acc.concat(val), [])
      .filter(z => !this.walls.includes(z) && z !== this.targetPosition);
  }
  // tslint:disable-next-line:typedef
  getPositionByValue(value, array): any[]{
    let result = [];
    for (let i = 0; i < array.length; i++){
      if (array[i].indexOf(value) !== -1){
        result.push(i);
        result.push(array[i].indexOf(value));
      }
    }
    return result;

  }
  // tslint:disable-next-line:typedef
   findingNeighbors(myArray, i, j) {
    const rowLimit = myArray.length - 1;
    const columnLimit = myArray[0].length - 1;
    let result = [];

    for (let x = Math.max(0, i - 1); x <= Math.min(i + 1, rowLimit); x++) {
      if (x !== i || j !== j) {
        result.push(myArray[x][j]);
      }
    }
    for (let y = Math.max(0, j - 1); y <= Math.min(j + 1, columnLimit); y++) {
       if (i !== i || y !== j) {
         result.push(myArray[i][y]);
       }
     }
    return result;
  }

  constructor(private title: Title) {
    this.title.setTitle("Find the way")
  }

  learn(): void{
    for (let i = 0; i < this.maxIter; i++) {
      this.searcherPosition = this.possibleRectangles[Math.floor(Math.random() * this.possibleRectangles.length)];
      while (true) {
        let [moves, movesValues] = this.getPossibleMoves();
        let values = this.getPossibleValues(moves);
        let chosenMove;
        if (Math.max.apply(Math, values) !== 0) {
          if (Math.random() < this.epsilon) {
            chosenMove = movesValues.indexOf(100) !== -1 ? chosenMove = moves[movesValues.indexOf(100)]
              : moves[Math.floor(Math.random() * moves.length)]
          }
          else {
            chosenMove = movesValues.indexOf(100) !== -1 ? chosenMove = moves[movesValues.indexOf(100)]
              : chosenMove = moves[values.indexOf(Math.max(...values))];
          }
        }
        else {
          chosenMove = movesValues.indexOf(100) !== -1 ? chosenMove = moves[movesValues.indexOf(100)]
            : moves[Math.floor(Math.random() * moves.length)]
        }
        let prevPos = this.searcherPosition;
        this.Q[prevPos][chosenMove] = Math.round(this.R[prevPos][chosenMove] + this.gamma * Math.max(...this.Q[chosenMove]))
        if (this.searcherPosition == this.targetPosition){
          break;
        }
        this.searcherPosition = chosenMove;
      }

    }
    this.searcherPosition = 34;
    this.isLearned = true;
    this.isReady = true;
  }

  getPossibleMoves(): any[]{
    let moves;
    moves = this.R[this.searcherPosition].reduce(function(arr, elem, index) {
      if (elem > -1){
        arr.push(index);
      }
      return arr;
    }, []);
    let movesValues =  this.R[this.searcherPosition].reduce(function(arr, elem, index) {
      if (elem > -1){
        arr.push(elem);
      }
      return arr;
    }, []);
    return [moves, movesValues];
  }

  getPossibleValues(moves: any[]): any[]{
    let values = [];
    moves.forEach(inx => values.push(this.Q[this.searcherPosition][inx]))
    return values;
  }

  async startTests(pos: number) {
    if (this.isLearned && this.isReady && this.walls.indexOf(pos) == -1){
      this.isReady = false;
      this.searcherPosition = pos;
      while (true) {
        let [moves, movesValues] = this.getPossibleMoves();
        let values = this.getPossibleValues(moves);
        let chosenMove = moves[values.indexOf(Math.max(...values))];
        await delay(500)
        this.searcherPosition = chosenMove;
        if (this.searcherPosition == this.targetPosition){
          this.isReady = true;
          break;
        }
      }
    }
  }
}


