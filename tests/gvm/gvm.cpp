#include <eosio/eosio.hpp>
#include <eosio/print.hpp>

using namespace eosio;

CONTRACT gvm : public contract {
public:
    using contract::contract;

    TABLE user {
        name username;
        uint64_t balance;
        uint64_t primary_key() const { return username.value; }
    };

    typedef eosio::multi_index<"users"_n, user> users_table;

    TABLE transaction {
        uint64_t id;
        name sender;
        name receiver;
        uint64_t amount;
        uint64_t primary_key() const { return id; }
    };

    typedef eosio::multi_index<"transactions"_n, transaction> transactions_table;

    template <typename... Tables>
       class B {
    public:
       std::tuple<std::reference_wrapper<Tables>...> tables;

       template <typename... Ts>
       B(Ts&&... ts) : tables(std::forward<Ts>(ts)...) {}

       void printCount(uint64_t tableIndex) {
          uint64_t totalCount = printCountHelper(std::index_sequence_for<Tables...>(), tableIndex);
          print("Total element count for tableIndex ", tableIndex, ": ", totalCount, "\n");
       }

    private:
       template <std::size_t... Is>
       uint64_t printCountHelper(std::index_sequence<Is...>, uint64_t tableIndex) {
          return (getCountForTable<Is>(tableIndex) + ...);
       }

       template <std::size_t I>
       uint64_t getCountForTable(uint64_t tableIndex) {
          uint64_t count = 0;
          if (I == tableIndex) {
             auto& table = std::get<I>(tables).get();
             auto itr = table.begin();
             while (itr != table.end()) {
                count++;
                itr++;
             }
          }
          return count;
       }
    };

    [[eosio::action]]
    void createuser(name username, uint64_t balance) {
        auto existing_user = _users.find(username.value);
        check(existing_user == _users.end(), "User already exists");
        _users.emplace(get_self(), [&](auto& new_user) {
            new_user.username = username;
            new_user.balance = balance;
        });
        print("User created: ", username);
    }

    [[eosio::action]]
    void maketrans(name sender, name receiver, uint64_t amount) {
        check(sender != receiver, "Sender and receiver must be different");
        auto sender_user = _users.find(sender.value);
        check(sender_user != _users.end(), "Sender not found");
        check(sender_user->balance >= amount, "Insufficient balance");
        _users.modify(sender_user, get_self(), [&](auto& user) {
            user.balance -= amount;
        });
        auto receiver_user = _users.find(receiver.value);
        if (receiver_user != _users.end()) {
           _users.modify(receiver_user, get_self(), [&](auto& user) {
              user.balance += amount;
           });
        }
        _transactions.emplace(get_self(), [&](auto& new_transaction) {
            new_transaction.id = _transactions.available_primary_key();
            new_transaction.sender = sender;
            new_transaction.receiver = receiver;
            new_transaction.amount = amount;
        });
        print("Transaction successful: ", sender, " sent ", amount, " to ", receiver);
    }

    [[eosio::action]]
    void testrowcount(uint64_t tableIndex) {
       b.printCount(tableIndex);
    }

    users_table          _users;
    transactions_table   _transactions;

    B<users_table, transactions_table> b{_users, _transactions};

    gvm(name receiver, name code, datastream<const char*> ds):
       contract(receiver, code, ds),
       _users(receiver, receiver.value),
       _transactions(receiver, receiver.value)
    {
    }
};
