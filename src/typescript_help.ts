// importing...

// "fetch_package_metadata", and ./ from below means the file is in
// the same directory as this file is in
import {fetch_package_metadata} from './fetch_package_metadata';

// -------------------------------------------------------------------------------

// variable declarations...

let age: number = 22; // let: variable can be changed (non-const)

const pi: number = 3.1415; // const: cannot be changed obviously

var income: number = 100000; // function scoped instead of block scoped...

// so if i declare a "let" varible inside of a loop, it cannot be used outside
// of the loop's braces. a "var" can be used outside of the loop, as long as
// it's still being used inside the function

let my_array: number[] = [1, 2, 3]
// my_array = [1, 2, 3]
my_array.push(4);
// my_array = [1, 2, 3, 4]

// other array methods: push, pop, 

// -------------------------------------------------------------------------------

// functions declarations
// takes 'a' and 'b', both <number> type, returns <number> type

function add_numbers(a: number, b: number): number {
    const result = a + b;
    return result;
}


  