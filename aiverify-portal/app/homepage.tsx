'use client';

import { Button, ButtonVariant } from '@/components/button';
import { Card } from '@/components/card/card';
import { Checkbox } from '@/components/checkbox';
import { Icon, IconName } from '@/components/IconSVG';
import { Modal } from '@/components/modal';
import { Slider } from '@/components/slider/Slider';
import { TextArea } from '@/components/textArea';
import { TextInput } from '@/components/textInput';

export function Homepage() {
  return (
    // <Modal
    //   heading="New AIV work in progress"
    //   enableScreenOverlay={false}
    //   height={250}
    //   primaryBtnLabel="Hello World"
    //   onCloseIconClick={() => null}
    //   onPrimaryBtnClick={() => alert('hello world')}>
    //   <p>Using Next.js</p>
    // </Modal>
    <div>
      <form className="w-[600px] bg-white rounded-lg p-10">
        <h1 className="text-2xl font-bold">Test</h1>
        <TextInput label="Name" />
        <TextInput label="Last Name" />
        <TextInput label="Email" />
        <TextArea label="Message" />
        <Checkbox label="Checkbox" />
        <Slider>
          <Slider.Track />
          <Slider.ProgressTrack />
          <Slider.Handle>
            <Slider.Value className="left-1/2 top-[-40px] -translate-x-1/2 transform" />
          </Slider.Handle>
        </Slider>
        <div className="flex gap-4 pt-2">
          <Button text="Submit" size="md" variant={ButtonVariant.PRIMARY} />
          <Button text="Cancel" variant={ButtonVariant.SECONDARY} size="md" />
        </div>
      </form>
      <div className="w-full rounded-lg p-10">
        <Card size="m">
        <Icon name={IconName.SolidBox} size={45} svgClassName="fill-white dark:fill-white" />
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </div>
        </Card>
        <Card size="m">
        <Icon name={IconName.SolidBox} size={45} svgClassName="fill-white dark:fill-white" />
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </div>
        </Card>
      </div>
    </div>
  );
}
