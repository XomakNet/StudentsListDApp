window.addEventListener('load', function () {

    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider);
        console.log("Metamask found");
        var t = PageMaintainer();
        EthereumConnector(window.web3, t, "../truffle/build/contracts/", "3");
    } else {
        console.log('No web3? You should consider trying MetaMask!')
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        //window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    // Now you can start your app & access web3 freely:


});

var EthereumConnector = function (web3, visualiser, contractsPath, networkId) {

    var tokens;
    var students;
    var addresses = {};

    var getStringFromHex = function (hex) {
        return web3.toAscii(hex).replace(/\0/g, '');
    };

    var getContract = function (name, networkId) {
        var url = contractsPath + name + ".json";
        return new Promise(function (resolve, reject) {
            $.ajax(url, {
                dataType: "json",
                data: null,
                error: reject,
                success: function (data) {
                    //console.log(data);
                    var factory = web3.eth.contract(data.abi);
                    var address = data.networks[networkId].address;
                    //setTimeout(() => resolve(factory.at(address)), 3000);
                    resolve(factory.at(address));
                }
            });
        });
    };

    var getAccount = function () {
        var currentAccount = web3.eth.accounts[0];
        if (currentAccount) {
            return currentAccount;
        }
        else {
            alert("Account is not selected in metamask.");
            return null;
        }
    };

    var _onNewStudentCommand = function (student) {
        getNameByAddress(getAccount()).then(function (currentName) {
            if (currentName.length === 0) {
                newStudent(student);
            }
            else {
                alert("Вы уже зарегистрированы.");
            }
        });
    };

    var init = function (networkId) {
        var tokensPromise = getContract("HumanStandardToken", networkId);
        var studentsPromise = getContract("StudentsRegistry", networkId);
        studentsPromise.then(function (studentsContract) {
            students = studentsContract;
            watchForStudents();
            tokensPromise.then(function (tokensContract) {
                tokens = tokensContract;
                watchForBalances();
            });
        });
        visualiser.onNewStudent(_onNewStudentCommand);
        //visualiser.onTransfer();
    };

    var getBalanceOf = function (address) {
        return new Promise(function (resolve, reject) {
            tokens.balanceOf.call(address, function (error, result) {
                resolve(result.c[0]);
            })
        });
    };

    var _onStudentRegistered = function (error, log) {
        if (!(addr in addresses)) {
            var args = log.args;
            var name = getStringFromHex(args.name);
            var addr = args.addr.toString();
            getBalanceOf(addr).then(function (balance) {
                addresses[addr] = visualiser.addStudent(name, balance);
            });
        }
    };

    var getNameByAddress = function (address) {
        return new Promise(function (resolve, reject) {
            console.log(address);
            students.names.call(address, function (error, result) {
                resolve(getStringFromHex(result));
            })
        });
    };

    var watchForStudents = function () {
        var registeredEvent = students.StudentRegistered(null, {fromBlock: 0, toBlock: 'latest'});
        registeredEvent.watch(_onStudentRegistered);
    };

    var getBalanceAndUpdate = function (address) {
        getBalanceOf(address).then(function (balance) {
            console.log(address, balance);
            addresses[address].changeBalance(balance);
        });
    };

    var _onBalanceUpdate = function (error, log) {
        console.log(log);
        var transactionAddresses = [log.args._to, log.args._from];
        for (var currentAddress of transactionAddresses) {
            currentAddress = currentAddress.toString();
            console.log(currentAddress);
            if (currentAddress in addresses) {
                getBalanceAndUpdate(currentAddress);
            }
        }

    };

    var watchForBalances = function () {
        var transferEvent = tokens.Transfer({}, {fromBlock: 0, toBlock: 'latest'});
        transferEvent.watch(_onBalanceUpdate);
    };

    var newStudent = function (name) {
        return new Promise(function (resolve, reject) {
            students.registerStudent.sendTransaction(name, function (error, result) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    };

    var makePayment = function (to, amount) {
        return new Promise(function (resolve, reject) {
            tokens.transfer.transact(to, amount, function (error, result) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });

    };

    init(networkId);
};

var PageMaintainer = function () {
    var table = $("#students");
    var newStudentForm = $("#studentRegisterForm");
    var studentTransferForm = $("#studentTransferForm");

    var that = {
        onNewStudent: function (callback) {
            newStudentForm.submit(function () {
                var studentsName = newStudentForm.find("input[type=text]").val();
                callback.call(newStudentForm, studentsName);
                return false;
            });
        },

        onTransfer: function (callback) {
            studentTransferForm.find("button").click(function () {
                var studentsName = newStudentForm.find("input.student-name").val();
                var transferAmount = newStudentForm.find("input.transfer-amount").val();
                callback.call(studentTransferForm, studentsName, transferAmount);
            });
        },

        addStudent: function (name, balance) {
            var row = $("<tr></tr>");
            var nameTd = $("<td></td>");
            var balanceTd = $("<td></td>");
            nameTd.text(name);
            balanceTd.text(balance);
            row.append(nameTd);
            row.append(balanceTd);
            table.append(row);

            return {
                changeBalance: function (balance) {
                    balanceTd.text(balance);
                }
            }

        },
    };

    return that;
};