questions = {
    "medium1": {
        "question": [
            
            '    print(f"Hello, {name}"',
            ')',
            'def greet(name):',
        ],
        "answer": 'def greet(name):\n    print(f"Hello, {name}")'
    },
    "medium2": {
        "question": [
            'print(sum(numbers))',
            'numbers = [1, 2, 3, 4,5]'
        ],
        "answer": 'numbers = [1, 2, 3, 4, 5]\nprint(sum(numbers))'
    }
}


function getRandomQuestion(){
    const keys=Object.keys(questions);
    const randomKey=keys[Math.floor(Math.random()*keys.length)];
    return {id:randomKey,...questions[randomKey]}

}


function checkAnswer(code,questionId){
   const cleanedInput = code.replace(/\s+/g, '').trim();
  const correct = questions[questionId].answer.replace(/\s+/g, '').trim();
  return cleanedInput === correct;
}

module.exports={getRandomQuestion,checkAnswer};