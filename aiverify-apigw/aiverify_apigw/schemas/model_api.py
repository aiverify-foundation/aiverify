from enum import StrEnum
from pydantic import BaseModel, Field, HttpUrl, model_validator, field_validator, ValidationInfo
from typing import List, Optional, Dict, Self


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
class OpenAPIAdditionalHeadersType(BaseModel):
    name: str = Field(
        min_length=1, 
        max_length=128, 
        description="Name of the header."
    )
    type: OpenAPIPrimitiveTypesEnum = Field(description="Primitive type of the header value.")
    value: Dict = Field(description="Value of the header in JSON format.")


class OpenAPIPathParamsType(BaseModel):
    name: str = Field(
        min_length=1, 
        max_length=128, 
        description="Name of the path parameter."
    )
    type: OpenAPIPrimitiveTypesEnum = Field(description="Primitive type of the path parameter.")


class QueryAPIParamsType(BaseModel):
    name: str = Field(
        min_length=1, 
        max_length=128, 
        description="Name of the query parameter."
    )
    type: OpenAPIPrimitiveTypesEnum = Field(description="Primitive type of the query parameter.")


class OpenAPIParametersPathType(BaseModel):
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


class OpenAPIParametersQueryType(BaseModel):
    mediaType: str = Field(description="Media type of the query parameter.")
    name: Optional[str] = Field(
        min_length=1, 
        max_length=128, 
        description="Name of the query parameter. Required if mediaType is not 'none'.",
        default=None,
    )
    isArray: bool = Field(description="Indicates if the parameter is an array. If mediaType == 'none' cannot be array")
    maxItems: Optional[int] = Field(None, ge=1, description="Maximum number of items if the query parameter is an array.")
    queryParams: Optional[List[QueryAPIParamsType]] = Field(None, description="List of query parameters.")

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


class OpenAPIParametersType(BaseModel):
    paths: Optional[OpenAPIParametersPathType] = Field(description="Path parameters configuration.", default=None)
    queries: Optional[OpenAPIParametersQueryType] = Field(description="Query parameters configuration.", default=None)


class OpenAPIRequestBodyPropertyType(BaseModel):
    field: str = Field(
        min_length=1, 
        max_length=128, 
        description="Field name in the request body. Must be between 1 and 128 characters."
    )
    type: OpenAPIPrimitiveTypesEnum = Field(description="Primitive type of the request body field.")


class OpenAPIRequestBodyType(BaseModel):
    mediaType: str = Field(description="Media type of the request body.")
    isArray: bool = Field(description="Indicates if the request body is an array.")
    name: Optional[str] = Field(
        min_length=1, 
        max_length=128, 
        description="Name of the payload property when the request body is an array.",
        default=None
    )
    maxItems: Optional[int] = Field(ge=1, description="Maximum number of items in the request body array.", default=None)
    properties: List[OpenAPIRequestBodyPropertyType] = Field(description="Properties of the request body.")

    @field_validator('mediaType')
    @classmethod
    def validate_media_type(cls, v: str, info: ValidationInfo):
        if v not in valid_media_types:
            raise ValueError("Invalid media type")
        return v
    

class OpenAPIResponseType(BaseModel):
    statusCode: int = Field(ge=200, le=299, description="HTTP status code of the response.")
    mediaType: str = Field(description="Media type of the response.")
    schema: Dict = Field(description="Schema of the response in JSON format.")

    @field_validator('mediaType')
    @classmethod
    def validate_media_type(cls, v: str, info: ValidationInfo):
        if v not in valid_media_types:
            raise ValueError("Invalid media type")
        return v


class ModelAPIRequestConfigType(BaseModel):
    sslVerify: bool = Field(description="Indicates whether to verify the SSL certificate.", default=True)
    connectionTimeout: int = Field(ge=-1, description="Timeout for connecting to the server, in seconds.", default=-1)
    rateLimit: int = Field(ge=-1, description="Maximum number of requests allowed per second.", default=-1)
    rateLimitTimeout: int = Field(ge=-1, description="Timeout when rate limiting is applied, in seconds.", default=-1)
    batchLimit: int = Field(ge=-1, description="Maximum number of requests in a batch.", default=-1)
    connectionRetries: int = Field(ge=-1, description="Number of retries for connecting to the server.", default=3)
    maxConnections: int = Field(ge=-1, description="Maximum number of concurrent connections allowed.", default=-1)
    batchStrategy: ModelAPIRequestConfigBatchStrategyEnum = Field(description="Batching strategy for requests.")


class ModelAPIType(BaseModel):
    method: OpenAPIMethodEnum = Field(description="HTTP method of the API (POST or GET).")
    url: HttpUrl = Field(description="URL of the API endpoint.")
    urlParams: Optional[str] = Field(description="URL parameters as a string.", default=None)
    authType: str = Field(description="Authentication type for the API.")
    authTypeConfig: Optional[Dict] = Field(description="Configuration for the authentication type.", default=None)
    additionalHeaders: Optional[List[OpenAPIAdditionalHeadersType]] = Field(description="Additional headers for the API.", default=None)
    parameters: Optional[OpenAPIParametersType] = Field(description="Parameters configuration for the API.", default=None)
    requestBody: Optional[OpenAPIRequestBodyType] = Field(description="Request body configuration for the API.", default=None)
    response: Optional[OpenAPIResponseType] = Field(description="Response configuration for the API.", default=None)
    requestConfig: Optional[ModelAPIRequestConfigType] = Field(description="Request configuration for the API.", default=None)

    @field_validator('authType')
    @classmethod
    def validate_auth_type(cls, v: str, info: ValidationInfo):
        if v not in valid_auth_types:
            raise ValueError("Invalid auth type")
        return v

    @model_validator(mode='after')
    def validate_model_api(self) -> Self:
        if self.method == OpenAPIMethodEnum.GET and self.requestBody:
            raise ValueError("GET requests should not have a request body.")
        return self
    