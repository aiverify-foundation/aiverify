import { Button, ButtonVariant } from '.';
import { IconName } from '../IconSVG';

function Temp() {
  return (
    <Button
      variant={ButtonVariant.SECONDARY}
      text="Temp"
      size="sm"
      icon={IconName.HistoryClock}
      iconPosition="right"
    />
  );
}

export default Temp;
