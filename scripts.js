// Abre e fecha tela de lançamentos
const Modal = {
    open(){
        document.querySelector('.modal-overlay')
        .classList.add('active')
    },
    close(){
        document.querySelector('.modal-overlay')
        .classList.remove('active')
    }
}

// Armanezamento no Browser
const Storage = {
    // Função que traz os lançamentos armanezados no localStorage e converte de Strig para o tipo array ou object (JSON.parse)
    get() {
        return JSON.parse(localStorage.getItem("dev.finances:transactions")) || []
    },
    
    // Adiciona os lançamentos no localStorage e converte de array para String (JSON.stringify)
    set(transactions) {
        localStorage.setItem("dev.finances:transactions", JSON.stringify(transactions))
    }
}

// Objeto com métodos de transações de inclusão e exclusão de lançamentos, soma das Entradas, Saídas, e total
const Transaction = {
    // Executa função que traz os lançamentos que estão no localStorage
    all: Storage.get(),
    
    // Recebe os dados de "transaction" via parâmetro e adiciona lançamento como elemento de um array pelo método "push"
    add(transaction) {
        Transaction.all.unshift(transaction)

        App.reload()
    },

    // Remove lançamento
    remove(index){
        Transaction.all.splice(index, 1)
 
        App.reload()
    },

    //Função de soma das entradas 
    incomes() {
        let income = 0;
    
        Transaction.all.forEach(transaction => {
                if(transaction.amount > 0) {
                    income += transaction.amount;
                }
            } 
        )

        return income;
    },

    //Função de soma das saídas
    expenses() {
        let expense = 0;

        Transaction.all.forEach(transaction => {
                if(transaction.amount < 0) {
                    expense += transaction.amount;
                }
            }
        )

        return expense;
    },

    // Função de soma Total
    total () {
        
        let total = 0;

        total = Transaction.incomes() + Transaction.expenses()
        
        return total;
    }
}

// Manipula os dados no HTML
const DOM = {
    // Chama a tabela a ser inserido os dados no HTML
    transactionsContainer: document.querySelector('#data-table tbody'),
    
    // Inclui os lançamentos no HTML (linha da tabela)
    addTransaction(transaction, index) {

        const tr = document.createElement('tr')
        tr.innerHTML = DOM.innerHTMLTransaction(transaction, index)
        tr.dataset.index = index;

        DOM.transactionsContainer.appendChild(tr)

    },
    
    //Inclui dados dos lançamentos no HTML (dados da linha)
    innerHTMLTransaction(transaction, index) {
        
        const CSSclass = transaction.amount > 0 ? "income" : "expense"

        const amount = Utils.formatCurrency(transaction.amount)

        const html =
        // Template literals 
        `
            <td class="description">${transaction.description}</td>
            <td class="${CSSclass}">${amount}</td>
            <td class='date'>${transaction.date}</td>
            <td>
                <img onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Remover transação">
            </td>
        `
        return html
    },

    // Atualiza valores totais de Entradas, Saídas e Total no HTML
    updateBalance() {
        document
            .getElementById('incomeDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.incomes())
        document
            .getElementById('expenseDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.expenses())
        document
            .getElementById('totalDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.total())
    },

    // Limpa tela. Obs: No primeiro lançamento como não tem nenhum elemento no array, ele não limpa nada. Mas a partir do segundo lançado para não dar duplicidade, ele limpa o primeiro elemento já lançado e lança de novo junto com o segundo, pois agora teremos 2 elementos no array.
    clearTransactions() {
        DOM.transactionsContainer.innerHTML = ""
    }
}

// formatadores (R$, date)
const Utils = { 
    // Função para formatar input valor do form
    formatAmount(value) {
        value = Number(value) * 100

        return value
    },
    
    // Função para formatar input data do form
    formatDate(date){
        const splittedDate = date.split("-")

        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`

    },

    // Função para formatar na moeda Real e adicionar o sinal nos totais
    formatCurrency(value){
        const signal = Number(value) < 0 ? "-" : ""

        value = String(value).replace(/\D/g, "")
        value = Number(value) / 100 

        value = value.toLocaleString("pt-BR", 
            {
            style: "currency",
            currency: "BRL"
            }
        )

        return signal + value
    }  
}

// Manipula o form
const Form = {
    // Selecionando os 3 inputs do Form (descrição, valor, data)
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),

    // Agrupando os dados dos inputs em uma única função
    getValues() {
        return {
            description: Form.description.value, 
            amount: Form.amount.value,
            date: Form.date.value
        }
    },

    // Formata os dados dos inputs
    formatValues() {
        // Desestruturar: ao invés de criar uma variável para cara atributo do objeto, o JS nos dá esta opção conforme apresentado abaixo. Desta maneira já foi criado uma variável "description", "amount", e "date".
        let {description, amount, date} = Form.getValues()

        amount = Utils.formatAmount(amount)

        date = Utils.formatDate(date)

        return {
            description,
            amount,
            date
        }
    },

    // Valida se tem algum input do form vazio
    ValidateFields() {
        const {description, amount, date} = Form.getValues()
        
        if(description.trim() === "" || 
           amount.trim() === "" || 
           date.trim() === "") {
               throw new Error("Por favor, preencha todos os campos")
           }
    },

    // Função que recebe os dados de "transaction" por parâmetro e executa função que adiciona lançamentos passando como argumento os dados de "transaction"
    saveTransaction(transaction) {
        Transaction.add(transaction)
    },
    
    //Limpa campos
    clearFields() {
        Form.description.value = "" 
        Form.amount.value = ""
        Form.date.value = ""
    },
    
    // Envia os dados do "Form"
    submit(event) {
        event.preventDefault() // Remove os dados enviados pelo formulário da URL

        try {
            // Executa o validador e retorna o erro caso encontre algum campo vazio
            Form.ValidateFields()
            // Cria variável "transaction" que recebe os dados formatados da função formatValues
            const transaction = Form.formatValues()
            // Executa função saveTransaction passando como argumento os dados da variável "transaction"
            Form.saveTransaction(transaction)
            //Limpa os campos do form
            Form.clearFields()
            // Fecha o form
            Modal.close()
        } catch (error) {
            // Retorna o erro caso tenha algo errado no validador.
            alert(error.message)
        }
    }
}

// Execução e reload do app
const App = {
    init() {
        // Função que pega os lançamentos e passa para função de inclusão no HTML. Este processo é chamado de "popular".
        Transaction.all.forEach((transaction, index) => {
            
            DOM.addTransaction(transaction, index)
        
        })
        
        // Executa a função para atualizar os valores de Entradas, Saídas, e total
        DOM.updateBalance()

        // Executa função de armazenamento no localStorage armazenando a transação que está no array "Transaction.all"
        Storage.set(Transaction.all)
    },

    // Executa a função "clearTransactions" que limpa os dados que estão na tela para que não fique duplicados e reinicia a aplicação 
    reload() {
        DOM.clearTransactions()
        App.init()
    }
}

App.init()