var StudentsRegistry = artifacts.require("StudentsRegistry");

contract('StudentsRegistry', function (accounts) {
    it("should correctly register student", function () {
        return StudentsRegistry.deployed().then((instance) => instance.registerStudent("Test")
            .then(function () {
                instance.names(accounts[0]).then(function (name) {
                    assert.equal(web3.toAscii(name).replace(/\0/g, ''), "Test");
                    return new Promise((resolve, reject) => {
                        var event = instance.StudentRegistered();
                        event.watch();
                        event.get((error, logs) => {
                            assert.equal(1, logs.length);
                            var log = logs[0];
                            assert.equal("Test", web3.toAscii(log.args.name).replace(/\0/g, ''));
                            assert.equal(accounts[0], log.args.addr);
                            resolve(log);
                        });
                        event.stopWatching();
                    });
                });
            }));
    });
});



