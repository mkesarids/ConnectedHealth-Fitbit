function mySettings(props) {
  return (
    <Page>
      <Section>
        <TextInput
          label="Name"
          value={{ name: props.settingsStorage.getItem('name') || '' }}
          onChange={(value) => {
            props.settingsStorage.setItem('name', value.name);
          }}
        />
        <Slider
          label={`Age: `+props.settingsStorage.getItem('age')}
          settingsKey="age"
          min="18"
          max="80"
          step="1"
        />
        <Select
          label={`Gender`}
          options={[
            {name:"male"},
            {name:"female"},
            {name:"other"}
          ]}
          settingsKey="genderJSON"
          onSelection={(selection) => {
            props.settingsStorage.setItem('gender', selection.values[0].name);
          }}
        />
        <Slider
          label={`Height: `+props.settingsStorage.getItem('height')+` inches`}
          settingsKey="height"
          min="48"
          max="96"
          step="1"
        />
        <Select
          label={`Workout`}
          options={[
            {name:"Bicep Curl"},
            {name:"Squat"},
            {name:"Test"}
          ]}
          settingsKey="workoutJSON"
          onSelection={(selection) => {
            props.settingsStorage.setItem('workout', selection.values[0].name);
          }}
        />
        <TextInput
          label="Workout Description"
          value={{ name: props.settingsStorage.getItem('workout_description') || '' }}
          onChange={(value) => {
            props.settingsStorage.setItem('workout_description', value.name);
          }}
        />
        <Button
          list
          label="Clear Settings Storage"
          onClick={() => props.settingsStorage.clear()}
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);
