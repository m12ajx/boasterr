import React from 'react';
import '@testing-library/jest-dom';

import { pickCategoryFields } from '../../../../util/fieldHelpers';
import { fakeIntl } from '../../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingDetailsForm from './EditListingDetailsForm';

const { screen, userEvent } = testingLibrary;

const noop = () => null;

describe('EditListingDetailsForm', () => {
  it('Check that shipping fees can be given and submit button activates', async () => {
    const user = userEvent.setup();
    const saveActionMsg = 'Save details';

    const selectableListingTypes = [
      {
        listingType: 'sell-bicycles',
        transactionProcessAlias: 'default-purchase/release-1',
        unitType: 'item',
      },
    ];

    const listingFieldsConfig = [
      {
        key: 'clothing',
        scope: 'public',
        listingTypeConfig: {
          limitToListingTypeIds: true,
          listingTypeIds: ['sell-bicycles'],
        },
        schemaType: 'enum',
        enumOptions: [
          { option: 'men', label: 'Men' },
          { option: 'women', label: 'Women' },
          { option: 'kids', label: 'Kids' },
        ],
        filterConfig: {
          showFilter: true,
          label: 'Clothing',
        },
        showConfig: {
          label: 'Clothing',
          isDetail: true,
        },
        saveConfig: {
          label: 'Clothing',
        },
      },
      {
        key: 'amenities',
        scope: 'public',
        listingTypeConfig: {
          limitToListingTypeIds: true,
          listingTypeIds: ['rent-bicycles-daily', 'rent-bicycles-nightly', 'rent-bicycles-hourly'],
        },
        schemaType: 'multi-enum',
        enumOptions: [
          { option: 'towels', label: 'Towels' },
          { option: 'bathroom', label: 'Bathroom' },
          { option: 'swimming_pool', label: 'Swimming pool' },
          { option: 'barbeque', label: 'Barbeque' },
        ],
        filterConfig: {
          showFilter: true,
          label: 'Amenities',
        },
        showConfig: {
          label: 'Amenities',
        },
        saveConfig: {
          label: 'Amenities',
        },
      },
    ];

    render(
      <EditListingDetailsForm
        intl={fakeIntl}
        dispatch={noop}
        onListingTypeChange={noop}
        onSubmit={v => v}
        saveActionMsg={saveActionMsg}
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
        listingFieldsConfig={listingFieldsConfig}
        categoryPrefix="categoryLevel"
        selectableCategories={[]}
        pickSelectedCategories={values => pickCategoryFields(values, 'categoryLevel', 1, [])}
        selectableListingTypes={selectableListingTypes}
        hasExistingListingType={true}
        initialValues={selectableListingTypes[0]}
        marketplaceCurrency="EUR"
      />
    );

    // Pickup fields
    const title = 'EditListingDetailsForm.title';
    expect(screen.getByText(title)).toBeInTheDocument();

    const description = 'EditListingDetailsForm.description';
    expect(screen.getByText(description)).toBeInTheDocument();

    // Test that save button is disabled at first
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeDisabled();

    // Fill mandatory attributes
    await user.type(screen.getByRole('textbox', { name: title }), 'My Listing');
    await user.type(screen.getByRole('textbox', { name: description }), 'Lorem ipsum');

    // Fill custom listing field
    await user.selectOptions(screen.getByLabelText('Clothing'), 'kids');

    // Test that save button is enabled
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeEnabled();
  });

  it('Check that a re-render with recreated initial values does not reset the form', async () => {
    const user = userEvent.setup();
    const saveActionMsg = 'Save details';

    const selectableListingTypes = [
      {
        listingType: 'sell-bicycles',
        transactionProcessAlias: 'default-purchase/release-1',
        unitType: 'item',
      },
    ];

    // The panel recreates initial values on every render, which means that the array-valued
    // additionalCategories is a new instance each time.
    const getInitialValues = () => ({ ...selectableListingTypes[0], additionalCategories: [] });

    const formProps = {
      intl: fakeIntl,
      dispatch: noop,
      onListingTypeChange: noop,
      onSubmit: v => v,
      saveActionMsg,
      updated: false,
      updateInProgress: false,
      disabled: false,
      ready: false,
      listingFieldsConfig: [],
      categoryPrefix: 'categoryLevel',
      selectableCategories: [],
      pickSelectedCategories: values => pickCategoryFields(values, 'categoryLevel', 1, []),
      selectableListingTypes,
      hasExistingListingType: true,
      marketplaceCurrency: 'EUR',
    };

    const { rerender } = render(
      <EditListingDetailsForm {...formProps} initialValues={getInitialValues()} />
    );

    const title = 'EditListingDetailsForm.title';
    await user.type(screen.getByRole('textbox', { name: title }), 'My Listing');
    expect(screen.getByRole('textbox', { name: title })).toHaveValue('My Listing');

    rerender(<EditListingDetailsForm {...formProps} initialValues={getInitialValues()} />);

    expect(screen.getByRole('textbox', { name: title })).toHaveValue('My Listing');
  });

  it('Check that additional categories can be picked and the primary category is left out', async () => {
    const user = userEvent.setup();
    const saveActionMsg = 'Save details';

    const selectableListingTypes = [
      {
        listingType: 'sell-bicycles',
        transactionProcessAlias: 'default-purchase/release-1',
        unitType: 'item',
      },
    ];

    const selectableCategories = [
      { id: 'cats', name: 'Cats' },
      { id: 'dogs', name: 'Dogs' },
      { id: 'birds', name: 'Birds' },
    ];

    render(
      <EditListingDetailsForm
        intl={fakeIntl}
        dispatch={noop}
        onListingTypeChange={noop}
        onSubmit={v => v}
        saveActionMsg={saveActionMsg}
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
        listingFieldsConfig={[]}
        categoryPrefix="categoryLevel"
        selectableCategories={selectableCategories}
        pickSelectedCategories={values =>
          pickCategoryFields(values, 'categoryLevel', 1, selectableCategories)
        }
        selectableListingTypes={selectableListingTypes}
        hasExistingListingType={true}
        initialValues={selectableListingTypes[0]}
        marketplaceCurrency="EUR"
      />
    );

    const additionalCategoriesLabel = 'EditListingDetailsForm.additionalCategoriesLabel';

    // Additional categories are only shown after the primary category has been selected.
    expect(screen.queryByText(additionalCategoriesLabel)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('EditListingDetailsForm.categoryLabel'), 'cats');

    expect(screen.getByText(additionalCategoriesLabel)).toBeInTheDocument();

    // The selected primary category is not among the options
    expect(screen.queryByRole('checkbox', { name: 'Cats' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Dogs' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Birds' })).toBeInTheDocument();

    // Multiple additional categories can be selected
    await user.click(screen.getByRole('checkbox', { name: 'Dogs' }));
    await user.click(screen.getByRole('checkbox', { name: 'Birds' }));
    expect(screen.getByRole('checkbox', { name: 'Dogs' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Birds' })).toBeChecked();

    // Changing the primary category to an already picked one removes it from the additional ones
    await user.selectOptions(screen.getByLabelText('EditListingDetailsForm.categoryLabel'), 'dogs');
    expect(screen.queryByRole('checkbox', { name: 'Dogs' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Cats' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Birds' })).toBeChecked();
  });
});
