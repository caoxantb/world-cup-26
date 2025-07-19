import { DateResolver } from "graphql-scalars";
import { GraphQLJSONObject } from "graphql-type-json";
import { GraphQLScalarType, Kind } from "graphql";

export const dateScalar = DateResolver;

export const jsonObjectScalar = GraphQLJSONObject;

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
