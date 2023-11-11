#include <eosio/eosio.hpp>
#include <eosio/print.hpp>
using namespace eosio;

#include <variant>

// ----------------------------------------------------------------------------

/*
sample output (cth gvm):

TEST: fixtureInit(): initializing test...
TEST: init(): setting up test environment...
doh_hotstart_start: successfully loaded and parsed 173 DoH constants from readonly contract
doh_hotstart_start: successfully started at P2P port 10002 (HTTP port: 20002)
TEST: init(): parsed 207 DoH error codes from '/home/fcecin/cth/local/test/doh-contracts/doh-common-code/error_codes.hpp'.
TEST: init(): OK
TEST: fixtureInit(): initialization OK.
test variants
#    eosio.null <= eosio.null::nonce            "424563dde5090600"
#           gvm <= gvm::testvar                 ""
>> int 42
>> double 3.140000000000000e+00
>> std::string Hello
>> AStruct 500
>> BStruct true
test variants done
TEST: fixtureFinish(): finishing test...
TEST: finish(): starting cleanup...
TEST: finish(): cleanup OK.

Fixture testing summary:


TEST: fixtureFinish(): completed all (0) tests successfully.
TEST: fixtureFinish(): process.exit(0)

*/

// ----------------------------------------------------------------------------

struct AStruct {
   int i;
};

struct BStruct {
   bool b;
};

CONTRACT gvm : public contract {
private:
   // Called when you forgot to write the method for a variant
   template <typename T>
   void othermethod(T& obj) {
      print("unknown type\n");
   }

   void othermethod(int& obj) {
      print("int ", obj, "\n");
   }

   void othermethod(double& obj) {
      print("double ", obj, "\n");
   }

   void othermethod(std::string& obj) {
      print("std::string ", obj, "\n");
   }

   void othermethod(AStruct& obj) {
      print("AStruct ", obj.i, "\n");
   }

   void othermethod(BStruct& obj) {
      print("BStruct ", obj.b, "\n");
   }

   template <typename... Ts>
   void processVariant(std::variant<Ts...>& var) {
      auto visitor = [this](auto&& arg) { this->othermethod(arg); };
      std::visit(visitor, var);
   }

public:
    using contract::contract;

    [[eosio::action]]
    void testvar() {
       typedef
          std::variant<int, double, std::string, AStruct, BStruct>
          VT;
       
       VT var1 = 42;
       processVariant(var1);
       
       VT var2 = 3.14;
       processVariant(var2);
       
       VT var3 = std::string("Hello");
       processVariant(var3);
       
       VT var4 = AStruct{500};
       processVariant(var4);
       
       VT var5 = BStruct{true};
       processVariant(var5);
    }

    gvm(name receiver, name code, datastream<const char*> ds):
       contract(receiver, code, ds)
    {
    }
};
