window.addEventListener('load', function() {

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

var EthereumConnector = function(web3, visualiser, contractsPath, networkId) {

    var tokens;
    var students;
    var addresses = {};

    var getStringFromHex = function(hex) {
        return web3.toAscii(hex).replace(/\0/g, '');
    };

    var getContract = function(name, networkId) {
        var url = contractsPath + name + ".json";
        return new Promise(function(resolve, reject) {
            $.ajax(url, {
                dataType: "json",
                data: null,
                error: reject,
                success: function(data) {
                    //console.log(data);
                    var factory = web3.eth.contract(data.abi);
                    var address = data.networks[networkId].address;
                    //setTimeout(() => resolve(factory.at(address)), 3000);
                    resolve(factory.at(address));
                }
            });
        });
    };

    var getContracts = function(networkId) {
        var tokensPromise = getContract("HumanStandardToken", networkId);

        var studentsPromise = getContract("StudentsRegistry", networkId);
        studentsPromise.then(function(studentsContract) {
            students = studentsContract;
            getStudents();
            tokensPromise.then(function (tokensContract) {
                tokens = tokensContract;
                setTimeout(watchForBalances, 1000);
            });
        });

    };

    var getBalanceOf = function(address) {
        return new Promise(function(resolve, reject) {
            tokens.balanceOf.call(address, function (error, result) {
                resolve(result.c[0]);
            })
        });
    };

    var getStudents = function() {
        var registeredEvent = students.StudentRegistered({}, { fromBlock: 0, toBlock: 'latest' });
        registeredEvent.get(function (error, logs) {
            for(var log of logs) {
                var args = log.args;
                var name = getStringFromHex(args.name);
                var addr = args.addr.toString();
                getBalanceOf(addr).then(function(balance) {
                    addresses[addr] = visualiser.addStudent(name, balance-2)
                });
            }
        });
        registeredEvent.watch();
    };

    var watchForBalances = function() {
        var transferEvent = tokens.Transfer({}, { fromBlock: 0, toBlock: 'latest' });
        transferEvent.get(function (error, logs) {
            for(var log of logs) {
                var addr = log.args._to.toString();
                console.log(addr, addresses, addr in addresses);
                if(addr in addresses) {
                    console.log("Get balance of");
                    getBalanceOf(addr).then(function(balance) {
                        addresses[addr].changeBalance(balance);
                        console.log(addr, balance);
                    });
                }
            }
            console.log(logs);
        });
        transferEvent.watch();
    };

    var makePayment = function(amount, to) {
        //tokens.
    };

    getContracts(networkId);
};

var PageMaintainer = function() {
    var table = $("#students");

    var that = {
        addStudent: function(name, balance) {
            var row = $("<tr></tr>");
            var nameTd = $("<td></td>");
            var balanceTd = $("<td></td>");
            nameTd.text(name);
            balanceTd.text(balance);
            row.append(nameTd);
            row.append(balanceTd);
            table.append(row);

            return {
                changeBalance: function(balance) {
                    balanceTd.text(balance);
                }
            }

        },
    };

    return that;
};