const { createUser, getUsers } = require("../services/user.service");

const initializeServer = async () => {
  try {
    const checkUserExists = await getUsers({ query: {} });

    if (checkUserExists.count === 0) {
      await createUser({
        body: {
          firstName: "Akash",
          lastName: "Kurup",
          email: "akash@skillScriber.ai",
          password: "password1",
        },
      });
      console.log("User created successfully");
    } else {
      console.log("User already exists");
    }
  } catch (error) {
    console.error("Error initializing server:", error);
  }
};

module.exports = { initializeServer };
