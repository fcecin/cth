#include <eosio/eosio.hpp>
#include <eosio/print.hpp>
using namespace eosio;

#include <variant>

// ----------------------------------------------------------------------------

CONTRACT gvm : public contract {
private:

public:
    using contract::contract;

    [[eosio::action]]
    void testgvm(std::vector<unsigned char> code) {
       
    }

    gvm(name receiver, name code, datastream<const char*> ds):
       contract(receiver, code, ds)
    {
    }
};
