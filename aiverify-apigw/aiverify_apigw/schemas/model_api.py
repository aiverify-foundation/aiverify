from enum import StrEnum
from pydantic import Field, HttpUrl, model_validator, field_validator, ValidationInfo
from typing import List, Optional, Dict, Self
from urllib.parse import urlparse, unquote

from .base_model import MyBaseModel


class OpenAPIPrimitiveTypesEnum(StrEnum):
    STRING = "string"
    NUMBER = "number"
    INTEGER = "integer"
    BOOLEAN = "boolean"


class OpenAPIAllTypesEnum(StrEnum):
    STRING = "string"
    NUMBER = "number"
    INTEGER = "integer"
    BOOLEAN = "boolean"
    ARRAY = "array"
    OBJECT = "object"


class OpenAPIMethodEnum(StrEnum):
    POST = "POST"
    GET = "GET"


class ModelAPIRequestConfigBatchStrategyEnum(StrEnum):
    NONE = "none"
    MULTIPART = "multipart"


# valid values
valid_media_types = [
    "none",
    "application/x-www-form-urlencoded",
    "multipart/form-data",
    "application/json",
    "text/plain",
]

valid_auth_types = [
    "No Auth",
    "Bearer Token",
    "Basic Auth",
]


# models
class OpenAPIAdditionalHeadersType(MyBaseModel):
    name: str = Field(
        min_length=1, 
        max_length=128, 
        description="Name of the header."
    )
    type: OpenAPIPrimitiveTypesEnum = Field(description="Primitive type of the header value.", strict=False)
    value: Dict = Field(description="Value of the header in JSON format.")


class OpenAPIPathParamsType(MyBaseModel):
    name: str = Field(
        min_length=1, 
        max_length=128, 
        description="Name of the path parameter."
    )
    type: OpenAPIPrimitiveTypesEnum = Field(description="Primitive type of the path parameter.", strict=False)


class QueryAPIParamsType(MyBaseModel):
    name: str = Field(
        min_length=1, 
        max_length=128, 
        description="Name of the query parameter."
    )
    type: OpenAPIPrimitiveTypesEnum = Field(description="Primitive type of the query parameter.", strict=False)


class OpenAPIParametersPathType(MyBaseModel):
    mediaType: str = Field(description="Media type of the path parameter. Default is 'none'.")
    isArray: bool = Field(description="Indicates if the parameter is an array. If mediaType == 'none' cannot be array")
    maxItems: Optional[int] = Field(None, ge=1, description="Maximum number of items if the parameter is an array.")
    pathParams: Optional[List[OpenAPIPathParamsType]] = Field(None, description="List of path parameters.")

    @field_validator('mediaType')
    @classmethod
    def validate_media_type(cls, v: str, info: ValidationInfo):
        if v not in valid_media_types:
            raise ValueError("Invalid media type")
        return v
    
    @model_validator(mode='after')
    def validate_isArray(self) -> Self:
        if self.mediaType == 'none' and self.isArray:
            raise ValueError("If mediaType == 'none' cannot be array")
        return self


class OpenAPIParametersQueryType(MyBaseModel):
    mediaType: str = Field(description="Media type of the query parameter.")
    name: Optional[str] = Field(
        min_length=1, 
        max_length=128, 
        description="Name of the query parameter. Required if mediaType is not 'none'.",
        default=None,
    )
    isArray: bool = Field(description="Indicates if the parameter is an array. If mediaType == 'none' cannot be array")
    maxItems: Optional[int] = Field(None, ge=1, description="Maximum number of items if the query parameter is an array.")
    queryParams: Optional[List[QueryAPIParamsType]] = Field(None, description="List of query parameters.", strict=False)

    @field_validator('mediaType')
    @classmethod
    def validate_media_type(cls, v: str, info: ValidationInfo):
        if v not in valid_media_types:
            raise ValueError("Invalid media type")
        return v
    
    @model_validator(mode='after')
    def validate_isArray(self) -> Self:
        if self.mediaType == 'none' and self.isArray:
            raise ValueError("If mediaType == 'none' cannot be array")
        if self.mediaType != 'none' and self.name is None:
            raise ValueError("name field cannot be empty if mediaType is not 'none'")
        return self


class OpenAPIParametersType(MyBaseModel):
    paths: Optional[OpenAPIParametersPathType] = Field(description="Path parameters configuration.", default=None, strict=False)
    queries: Optional[OpenAPIParametersQueryType] = Field(description="Query parameters configuration.", default=None, strict=False)


class OpenAPIRequestBodyPropertyType(MyBaseModel):
    field: str = Field(
        min_length=1, 
        max_length=128, 
        description="Field name in the request body. Must be between 1 and 128 characters."
    )
    type: OpenAPIPrimitiveTypesEnum = Field(description="Primitive type of the request body field.", strict=False)


class OpenAPIRequestBodyType(MyBaseModel):
    mediaType: str = Field(description="Media type of the request body.")
    isArray: bool = Field(description="Indicates if the request body is an array.")
    name: Optional[str] = Field(
        min_length=1, 
        max_length=128, 
        description="Name of the payload property when the request body is an array.",
        default=None
    )
    maxItems: Optional[int] = Field(ge=1, description="Maximum number of items in the request body array.", default=None)
    properties: List[OpenAPIRequestBodyPropertyType] = Field(description="Properties of the request body.", strict=False)

    @field_validator('mediaType')
    @classmethod
    def validate_media_type(cls, v: str, info: ValidationInfo):
        if v not in valid_media_types:
            raise ValueError("Invalid media type")
        return v
    

class OpenAPIResponseType(MyBaseModel):
    statusCode: int = Field(ge=200, le=299, description="HTTP status code of the response.")
    mediaType: str = Field(description="Media type of the response.")
    schema: Dict = Field(description="Schema of the response in JSON format.")

    @field_validator('mediaType')
    @classmethod
    def validate_media_type(cls, v: str, info: ValidationInfo):
        if v not in valid_media_types:
            raise ValueError("Invalid media type")
        return v


class ModelAPIRequestConfigType(MyBaseModel):
    sslVerify: bool = Field(description="Indicates whether to verify the SSL certificate.", default=True)
    connectionTimeout: int = Field(ge=-1, description="Timeout for connecting to the server, in seconds.", default=-1)
    rateLimit: int = Field(ge=-1, description="Maximum number of requests allowed per second.", default=-1)
    rateLimitTimeout: int = Field(ge=-1, description="Timeout when rate limiting is applied, in seconds.", default=-1)
    batchLimit: int = Field(ge=-1, description="Maximum number of requests in a batch.", default=-1)
    connectionRetries: int = Field(ge=-1, description="Number of retries for connecting to the server.", default=3)
    maxConnections: int = Field(ge=-1, description="Maximum number of concurrent connections allowed.", default=-1)
    batchStrategy: ModelAPIRequestConfigBatchStrategyEnum = Field(description="Batching strategy for requests.", strict=False)


class ModelAPIParametersMapping(MyBaseModel):
    requestBody: Optional[Dict] = Field(description="Parameter mapping for request body", default=None)
    parameters: Optional[Dict] = Field(description="Parameter mapping for path parameters", default=None)


class ModelAPIType(MyBaseModel):
    method: OpenAPIMethodEnum = Field(description="HTTP method of the API (POST or GET).", strict=False)
    url: HttpUrl = Field(description="URL of the API endpoint.", strict=False)
    urlParams: Optional[str] = Field(description="URL parameters as a string.", default=None)
    authType: str = Field(description="Authentication type for the API.")
    authTypeConfig: Optional[Dict] = Field(description="Configuration for the authentication type.", default=None)
    additionalHeaders: Optional[List[OpenAPIAdditionalHeadersType]] = Field(description="Additional headers for the API.", default=None)
    parameters: Optional[OpenAPIParametersType] = Field(description="Parameters configuration for the API.", default=None, strict=False)
    requestBody: Optional[OpenAPIRequestBodyType] = Field(description="Request body configuration for the API.", default=None, strict=False)
    response: OpenAPIResponseType = Field(description="Response configuration for the API.", strict=False)
    requestConfig: Optional[ModelAPIRequestConfigType] = Field(description="Request configuration for the API.", default=None, strict=False)
    # parameterMappings: Optional[ModelAPIParametersMapping] = Field(description="Specify the parameter mappings")

    @field_validator('authType')
    @classmethod
    def validate_auth_type(cls, v: str, info: ValidationInfo):
        if v not in valid_auth_types:
            raise ValueError("Invalid auth type")
        return v

    @model_validator(mode='after')
    def validate_model_api(self) -> Self:
        # if self.method == OpenAPIMethodEnum.GET and self.requestBody:
        #     raise ValueError("GET requests should not have a request body.")
        self.exportModelAPI()
        return self

    def exportModelAPI(self) -> Dict:
        import re
        from openapi_spec_validator import validate
        # Initialize the base OpenAPI spec
        spec = {
            "openapi": "3.0.3",
            "info": {
                "title": "API-Based Testing",
                "version": "1.0.0",
            },
            "paths": {}
        }

        # Parse the URL
        url = str(self.url).rstrip("/")
        if self.urlParams:
            url += self.urlParams
        parsed_url = urlparse(url)
        url_base = f"{parsed_url.scheme}://{parsed_url.netloc}"
        url_pathname = unquote(parsed_url.path)

        # Add servers to the spec
        spec["servers"] = [{"url": url_base}]

        # Create the path object
        path_obj = {
            "parameters": [],
            "responses": {
                str(self.response.statusCode): {
                    "description": "successful operation",
                    "content": {
                        self.response.mediaType: {
                            "schema": self.response.schema,
                        }
                    },
                }
            }
        }

        # Add authentication if specified
        if self.authType in ["Bearer Token", "Basic Auth"]:
            scheme = "bearer" if self.authType == "Bearer Token" else "basic"
            spec["components"] = {
                "securitySchemes": {
                    "myAuth": {
                        "type": "http",
                        "scheme": scheme,
                    }
                }
            }
            path_obj["security"] = [{"myAuth": []}]

        # Add additional headers
        if self.additionalHeaders:
            for header in self.additionalHeaders:
                path_obj["parameters"].append({
                    "in": "header",
                    "name": header.name,
                    "required": True,
                    "schema": {
                        "type": header.type,
                        "enum": [header.value],
                    },
                })

        # Add path parameters if any
        path_match = re.findall(r"\{([a-z0-9_\-\s]+)\}", url_pathname, re.IGNORECASE)
        if len(path_match) > 0 and self.parameters and self.parameters.paths and self.parameters.paths.pathParams and len(self.parameters.paths.pathParams) > 0:
            is_complex = self.parameters.paths.mediaType != "none"
            if not is_complex:
                for attr in path_match:
                    p = next((p for p in self.parameters.paths.pathParams if p.name == attr), None)
                    if not p:
                        raise ValueError(f"Path parameter {{{attr}}} not defined")
                    pobj = {
                        "in": "path",
                        "name": p.name,
                        "required": True,
                        "schema": {
                            "type": p.type,
                        },
                    }
                    path_obj["parameters"].append(pobj)
            else:
                if len(path_match) != 1:
                    # impose condition of only one path param for objects
                    raise ValueError("Require one path variable for complex serialization")
                
                name: str = path_match[0]
                if not name or len(name) == 0:
                    raise ValueError("Name field required for parameters with complex serialization")
                
                properties = {}
                required = []
                for p in self.parameters.paths.pathParams:
                    properties[p.name] = {
                        "type": p.type,
                    }
                    required.append(p.name)
                
                object_definition = {
                    "type": "object",
                    "properties": properties,
                    "required": required,
                }
                
                if self.parameters.paths.isArray:
                    schema = {
                        "type": "array",
                        "items": object_definition,
                    }
                    if self.parameters.paths.maxItems:
                        schema["maxItems"] = self.parameters.paths.maxItems
                    
                    path_obj["parameters"].append({
                        "in": "path",
                        "name": name,
                        "required": True,
                        "content": {
                            self.parameters.paths.mediaType: {
                                "schema": schema,
                            },
                        },
                    })
                else:
                    path_obj["parameters"].append({
                        "in": "path",
                        "name": name,
                        "required": True,
                        "content": {
                            self.parameters.paths.mediaType: {
                                "schema": object_definition,
                            },
                        },
                    })

        elif len(path_match) > 0:
            raise ValueError("Path parameters not defined")
        elif len(path_match) == 0 and self.parameters and self.parameters.paths:
            raise ValueError("urlParams not defined for paths")

        # Add query parameters if any
        if self.parameters and self.parameters.queries and self.parameters.queries.queryParams and len(self.parameters.queries.queryParams) > 0:
            is_complex = self.parameters.queries.mediaType and self.parameters.queries.mediaType != "none";
            if not is_complex:
                for p in self.parameters.queries.queryParams:
                    pobj = {
                        "in": "query",
                        "name": p.name,
                        "required": True,
                        "schema": {
                            "type": p.type,
                        },
                    }
                    path_obj["parameters"].append(pobj)
            else:
                if not self.parameters.queries.name or len(self.parameters.queries.name) == 0:
                    raise ValueError("Name field required for parameters with complex serialization")
                
                name = self.parameters.queries.name
                properties = {}
                required = []
                for p in self.parameters.queries.queryParams:
                    properties[p.name] = {
                        "type": p.type,
                    }
                    required.append(p.name)
                
                object_definition = {
                    "type": "object",
                    "properties": properties,
                    "required": required,
                }
                
                if self.parameters.queries.isArray:
                    schema = {
                        "type": "array",
                        "items": object_definition,
                    }
                    if self.parameters.queries.maxItems:
                        schema["maxItems"] = self.parameters.queries.maxItems
                    
                    path_obj["parameters"].append({
                        "in": "query",
                        "name": name,
                        "content": {
                            self.parameters.queries.mediaType: {
                                "schema": schema,
                            },
                        },
                    })
                else:
                    path_obj["parameters"].append({
                        "in": "query",
                        "name": name,
                        "content": {
                            self.parameters.queries.mediaType: {
                                "schema": object_definition,
                            },
                        },
                    })

        # Add request body
        if self.requestBody and self.requestBody.mediaType != "none":
            if self.method == OpenAPIMethodEnum.GET:
                raise ValueError("GET methods cannot have a request body")
            properties = {
                prop.field: {"type": prop.type} for prop in self.requestBody.properties
            }
            required = [prop.field for prop in self.requestBody.properties]
            object_definition = {
                "type": "object",
                "properties": properties,
                "required": required,
            }
            if self.requestBody.isArray:
                schema = {
                    "type": "array",
                    "items": object_definition,
                }
                if self.requestBody.name and len(self.requestBody.name) > 0:
                    schema = {
                        "type": "object",
                        "properties": {
                            self.requestBody.name: schema
                        }
                    }
                if self.requestBody.maxItems:
                    schema["maxItems"] = self.requestBody.maxItems
                path_obj["requestBody"] = {
                    "required": True,
                    "content": {
                        self.requestBody.mediaType: {
                            "schema": schema
                        }
                    }
                }
            else:
                path_obj["requestBody"] = {
                    "required": True,
                    "content": {
                        self.requestBody.mediaType: {
                            "schema": object_definition
                        }
                    }
                }

        # Add path object to spec
        spec["paths"][url_pathname] = {self.method.value.lower(): path_obj}

        try:
            validate(spec) # type: ignore
        except:
            raise ValueError(f"Not valid 3.x OpenAPI schema")

        # Return the final spec
        return spec


class ModelAPIExportSchema(MyBaseModel):
    requestConfig: Optional[ModelAPIRequestConfigType] = Field(description="Request configuration for the API.", default=None, strict=False)
    response: OpenAPIResponseType = Field(description="Response configuration for the API.", strict=False)
    openapiSchema: dict = Field(description="Contains the openapi schema")
    requestBody: Optional[Dict] = Field(description="Parameter mapping for request body", default=None)
    parameters: Optional[Dict] = Field(description="Parameter mapping for path parameters", default=None)
