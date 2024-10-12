import Ajv from 'ajv'
import schema from './../schema/metalists-schema.json'

export const tokenListValidator = new Ajv({ allErrors: true }).compile(schema)
