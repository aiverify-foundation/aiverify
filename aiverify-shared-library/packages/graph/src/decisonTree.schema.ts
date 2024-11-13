export const graphdataSchema = {
  "title": "AI Verify Decision Tree Graph Data Schema",
  "description": "AI Verify Decision Tree Graph Data Schema",
  "type": "object",
  "properties": {
    "nodes": {
      "type": "array",
      "minItems": 1,
      "items": {
        "description": "Graph nodes",
        "type": "object",
        "properties": {
          "data": {
            "type": "object",
            "properties": {
              "id": {
                "description": "Unique ID that identifies the node in the graph",
                "type": "string"
              },
              "type": {
                "description": "Type of node",
                "type": "string",
                "enum": [
                  "outcome",
                  "question",
                  "metric",
                  "metric2"
                ]
              },
              "text": {
                "description": "Text that will be displayed within the node",
                "type": "string"
              },
              "stext": {
                "description": "Template text that will be displayed as text with definition substitution",
                "type": "string"
              },
              "gqn": {
                "description": "List of questions that will be displayed and prompt user for input",
                "type": "array",
                "minItems": 1,
                "items": {
                  "type": "string"
                }
              },
              "text_positive": {
                "description": "Metric for positive labels",
                "type": "string"
              },
              "text_negative": {
                "description": "Metric for positive labels",
                "type": "string"
              }
            },
            "required": [
              "id",
              "type"
            ],
            "if": {
              "properties": {
                "type": {
                  "const": "metric2"
                }
              },
            },
            "then": {
              "required": [
                "text_negative",
                "text_positive"
              ]
            },
            "else": {
              "anyOf": [
                {
                  "required": [
                    "text"
                  ]
                },
                {
                  "required": [
                    "stext"
                  ]
                }
              ]
            },
            "allOf": [
              {
                "if": {
                  "properties": {
                    "type": {
                      "const": "outcome"
                    }
                  }
                },
                "then": {
                  "required": [
                    "gqn"
                  ]
                }
              },
              {
                "if": {
                  "properties": {
                    "type": {
                      "const": "question"
                    }
                  }
                },
                "then": {
                  "required": [
                    "gqn"
                  ]
                }
              }
            ]
          }
        },
        "required": [
          "data"
        ]
      }
    },
    "edges": {
      "description": "Graph edges",
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "data": {
            "type": "object",
            "properties": {
              "id": {
                "description": "Unique ID that identifies the edge in the graph",
                "type": "string"
              },
              "source": {
                "description": "ID of source node",
                "type": "string"
              },
              "target": {
                "description": "ID of target node",
                "type": "string"
              },
              "text": {
                "description": "Text that will be displayed within the node",
                "type": "string"
              },
              "stext": {
                "description": "Template text that will be displayed as text with definition substitution",
                "type": "string"
              }
            },
            "required": [
              "id",
              "source",
              "target"
            ]
          }
        },
        "required": [
          "data"
        ]
      }
    }
  },
  "required": [
    "nodes"
  ]
}


export const defintionSchema = {
  "title": "AI Verify Decision Tree Definition",
  "description": "Schema for the Decision Tree definitions, used for text substitution in the graph stext data",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "key": {
        "description": "Substitution key that will be used to search and replace with corresponding value in the decision graph data stext field. Substitution keys in the stext are denoted by [key]",
        "type": "string"
      },
      "name": {
        "description": "Name of the definition",
        "type": "string"
      },
      "description": {
        "description": "Describes the definition",
        "type": "string"
      }
    },
    "required": [
      "key",
      "name"
    ]
  }
}