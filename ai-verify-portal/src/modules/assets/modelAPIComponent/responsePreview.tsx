import { ColorPalette } from 'src/components/colorPalette';
import { MediaType, OpenApiDataTypes, ResponseForm } from './types';

type ReponsePreviewProps = {
  responseType: ResponseForm;
};

function ResponsePreview(props: ReponsePreviewProps) {
  const { responseType } = props;
  const { schema } = responseType;

  let shape = '';
  if (responseType.mediaType === MediaType.TEXT_PLAIN) {
    return null;
  } else if (responseType.mediaType === MediaType.APP_JSON) {
    if (responseType.schema.type === OpenApiDataTypes.OBJECT) {
      if (responseType.fieldValueType !== OpenApiDataTypes.ARRAY) {
        let val = '0.1';
        if (responseType.fieldValueType === OpenApiDataTypes.STRING) {
          val = 'age';
        } else if (responseType.fieldValueType === OpenApiDataTypes.BOOLEAN) {
          val = 'true';
        }
        shape = `{
  ${responseType.field}: ${val}
}`;
      } else {
        let val = '';
        if (
          responseType.schema.properties?._AIVDATA_.items?.type ===
          OpenApiDataTypes.INTEGER
        ) {
          val = '0.1, 0.4, 0.7';
        } else if (
          responseType.schema.properties?._AIVDATA_.items?.type ===
          OpenApiDataTypes.STRING
        ) {
          val = 'age, name, gender';
        } else if (
          responseType.schema.properties?._AIVDATA_.items?.type ===
          OpenApiDataTypes.BOOLEAN
        ) {
          val = 'true, true, false';
        }
        shape = `{
  ${responseType.field}: [ ${val} ]
}`;
      }
    } else if (responseType.schema.type === OpenApiDataTypes.ARRAY) {
      if (responseType.schema.items?.type !== OpenApiDataTypes.OBJECT) {
        let val = '0.1, 0.4, 0.7';
        if (responseType.schema.items?.type === OpenApiDataTypes.STRING) {
          val = 'age, name, gender';
        } else if (
          responseType.schema.items?.type === OpenApiDataTypes.BOOLEAN
        ) {
          val = 'true, true, false';
        }
        shape = `{
  [ ${val} ]
}`;
      } else {
        let val = '';
        if (
          responseType.schema.items.properties?._AIVDATA_.type ===
          OpenApiDataTypes.INTEGER
        ) {
          val = `{ ${responseType.field}: '0.1' }, { ${responseType.field}: '0.4' }, { ${responseType.field}: '0.7' }`;
        } else if (
          responseType.schema.items.properties?._AIVDATA_.type ===
          OpenApiDataTypes.STRING
        ) {
          val = `{ ${responseType.field}: 'age' }, { ${responseType.field}: 'name' }, { ${responseType.field}: 'gender' }`;
        } else if (
          responseType.schema.items.properties?._AIVDATA_.type ===
          OpenApiDataTypes.BOOLEAN
        ) {
          val = `{ ${responseType.field}: 'true' }, { ${responseType.field}: 'true' }, { ${responseType.field}: 'false' }`;
        }
        shape = `[
  ${val}
]`;
      }
    }
  }

  return (
    <div>
      <div
        style={{
          color: ColorPalette.gray,
          fontWeight: 600,
          marginBottom: 10,
          marginTop: 35,
          fontSize: 14,
        }}>
        Example Response Value
      </div>
      <pre>{shape}</pre>
    </div>
  );
}

export { ResponsePreview };
