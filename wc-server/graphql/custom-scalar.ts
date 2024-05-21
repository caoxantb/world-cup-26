import { GraphQLScalarType, Kind } from "graphql";

export const dateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type",
  serialize(value) {
    if (value instanceof Date) {
      return value.getTime(); // Convert outgoing Date to integer for JSON
    }
    throw Error("GraphQL Date Scalar serializer expected a `Date` object");
  },
  parseValue(value) {
    if (typeof value === "number") {
      return new Date(value); // Convert incoming integer to Date
    }
    throw new Error("GraphQL Date Scalar parser expected a `number`");
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      // Convert hard-coded AST string to integer and then to Date
      return new Date(parseInt(ast.value, 10));
    }
    // Invalid hard-coded value (not an integer)
    return null;
  },
});

export const numberScalar = new GraphQLScalarType({
  name: "Number",
  description:
    "Custom scalar type for a number that can be either an integer or a float",

  // Serialize function converts your custom scalar to a string for output
  serialize(value) {
    // Ensure the provided value is a number
    if (typeof value !== "number") {
      throw new Error("NumberScalar can only serialize numbers");
    }

    // Serialize the number
    return value;
  },

  // ParseValue function converts input value into the desired format
  parseValue(value) {
    // Ensure the provided value is a number
    if (typeof value !== "number") {
      throw new Error("NumberScalar can only parse numbers");
    }

    // Parse the number
    return value;
  },

  // ParseLiteral function parses AST literals into the desired format
  parseLiteral(ast) {
    // Ensure the AST kind is either INT or FLOAT
    if (ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
      // Parse the number
      return parseFloat(ast.value);
    } else {
      throw new Error(
        "NumberScalar can only parse AST literals of kind INT or FLOAT"
      );
    }
  },
});
