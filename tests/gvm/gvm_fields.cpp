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

    template <typename Table, typename... Fields>
       class TableInfo {
    public:
       using table_type = Table;
       std::tuple<Fields...> fields;

       TableInfo(Fields... args) : fields(std::forward<Fields>(args)...) {}
    };

    // Trait to get field count for a table type
    template <typename TableInfoType>
       struct FieldCountTrait;

    template <typename Table, typename... Fields>
       struct FieldCountTrait<TableInfo<Table, Fields...>> {
       static constexpr std::size_t count = sizeof...(Fields);
    };

    template <typename... TableInfos>
       class B {
    public:
       std::tuple<std::reference_wrapper<typename TableInfos::table_type>...> tables;

       template <typename... Ts>
       B(Ts&&... ts) : tables(std::forward<Ts>(ts)...) {}

       std::size_t getFieldCount(uint64_t tableIndex) const {
          return getFieldCountHelper(std::index_sequence_for<TableInfos...>(), tableIndex);
       }

       void printFieldCount(uint64_t tableIndex) const {
          print("Field count for tableIndex ", tableIndex, ": ", getFieldCount(tableIndex), "\n");
       }

    private:
       template <std::size_t... Is>
       std::size_t getFieldCountHelper(std::index_sequence<Is...>, uint64_t tableIndex) const {
          return (getFieldCountForTable<Is>(tableIndex) + ...);
       }

       template <std::size_t I>
       std::size_t getFieldCountForTable(uint64_t tableIndex) const {
          std::size_t count = 0;
          if (I == tableIndex) {
             count = FieldCountTrait<typename std::tuple_element<I, std::tuple<TableInfos...>>::type>::count;
          }
          return count;
       }
    };

    [[eosio::action]]
    void testrowcount(uint64_t tableIndex) {
       b.printFieldCount(tableIndex);
    }

    using UserFields = TableInfo<users_table, name, uint64_t>;
    using TransactionFields = TableInfo<transactions_table, uint64_t, name, name, uint64_t>;

    users_table          _users;
    transactions_table   _transactions;

    B<UserFields, TransactionFields> b{_users, _transactions};

    gvm(name receiver, name code, datastream<const char*> ds):
       contract(receiver, code, ds),
       _users(receiver, receiver.value),
       _transactions(receiver, receiver.value)
    {
    }
};
