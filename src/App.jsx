import React, { useState, useEffect } from 'react';
import {
  ChakraProvider, Box, Container, FormControl, FormLabel, Input, Button, RadioGroup, Radio, Stack,
  Heading, Text
} from '@chakra-ui/react';
import { addBusinessDays, getDay, format } from 'date-fns';

const App = () => {
  const [brutoIncome, setBrutoIncome] = useState('');
  const [dateRequested, setDateRequested] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [upworkType, setUpworkType] = useState('fixed');
  const [results, setResults] = useState(null);
  const [usdToRsdRate, setUsdToRsdRate] = useState(1); // Default value of 1 for USD to RSD conversion

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://v6.exchangerate-api.com/v6/bd7aaabed56a93e5652369a6/latest/USD');
        const data = await response.json();
        if (data.result === "success") {
          setUsdToRsdRate(data.conversion_rates.RSD);
        } else {
          console.error('Error fetching exchange rate:', data["error-type"]);
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      }
    };

    fetchExchangeRate();
  }, []);

  const handleDateChange = (event) => {
    setDateRequested(event.target.value);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
  };

  const calculate = () => {
    const bruto = parseFloat(brutoIncome);
    if (isNaN(bruto)) {
      alert('Please enter a valid bruto income.');
      return;
    }

    const dateReq = new Date(dateRequested);

    // Option 1: Direct PayPal Payment
    const paypalFee = 0.05465 * bruto;
    const potentialIncomePayPal = (bruto - paypalFee) * usdToRsdRate;
    const dateEstimationPayPal1 = addBusinessDays(dateReq, 2);
    const dateEstimationPayPal2 = addBusinessDays(dateReq, 3);

    // Option 2: Upwork Payment
    const upworkFee = 0.1 * bruto;
    const transactionFee = 1;
    const potentialIncomeUpwork = (bruto - upworkFee - transactionFee) * usdToRsdRate;
    let dateEstimationUpwork1, dateEstimationUpwork2;

    if (upworkType === 'fixed') {
      dateEstimationUpwork1 = addBusinessDays(dateReq, 7);
      dateEstimationUpwork2 = dateEstimationUpwork1;
    } else {
      const day = getDay(dateReq);
      if (day >= 0 && day <= 3) {
        dateEstimationUpwork1 = addBusinessDays(dateReq, 2 + (3 - day) + 7);
      } else {
        dateEstimationUpwork1 = addBusinessDays(dateReq, 2 + (10 - day));
      }
      dateEstimationUpwork2 = addBusinessDays(dateEstimationUpwork1, 2);
    }

    setResults({
      brutoIncome: bruto.toFixed(2),
      paypal: {
        fee: paypalFee.toFixed(2),
        potentialIncome: potentialIncomePayPal.toFixed(2),
        dateEstimation: `${dateEstimationPayPal1.toDateString()} - ${dateEstimationPayPal2.toDateString()}`
      },
      upwork: {
        fee: upworkFee.toFixed(2),
        transactionFee: transactionFee.toFixed(2),
        potentialIncome: potentialIncomeUpwork.toFixed(2),
        dateEstimation: `${dateEstimationUpwork1.toDateString()} - ${dateEstimationUpwork2.toDateString()}`
      },
      dateRequested: dateReq.toDateString()
    });
  };

  return (
    <ChakraProvider>
      <Container maxW="container.md" py={6}>
        <Heading as="h1" mb={6}>Income Calculator by Goran v1</Heading>
        <Box mb={4}>
          <FormControl id="brutoIncome">
            <FormLabel>Enter income in USD</FormLabel>
            <Input
              type="number"
              step="0.01"
              value={brutoIncome}
              onChange={(e) => setBrutoIncome(e.target.value)}
            />
          </FormControl>
        </Box>
        <Box mb={4}>
          <FormControl id="dateRequested">
            <FormLabel>Date requested</FormLabel>
            <Input
              type="date"
              value={dateRequested}
              onChange={handleDateChange}
            />
          </FormControl>
        </Box>
        <Box mb={4}>
          <FormControl id="upworkType">
            <FormLabel>Upwork Contract Type:</FormLabel>
            <RadioGroup value={upworkType} onChange={setUpworkType}>
              <Stack direction="row">
                <Radio value="fixed">Fixed-price</Radio>
                <Radio value="hourly">Hourly</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
        </Box>
        <Button colorScheme="teal" onClick={calculate}>Calculate</Button>
        {results && (
          <Box mt={6}>
            <Heading as="h2" size="lg" mb={4}>Results</Heading>
            <Box mb={4}>
              <Heading as="h3" size="md">Option 1: Direct PayPal Payment</Heading>
              <Text>Bruto Income: ${formatNumber(results.brutoIncome)}</Text>
              <Text>PayPal Fee: ${formatNumber(results.paypal.fee)}</Text>
              <Text>Potential Income: ~{formatNumber(results.paypal.potentialIncome)} RSD</Text>
              <Text>Date Requested: {results.dateRequested}</Text>
              <Text>Date Estimation to Arrive: {results.paypal.dateEstimation}</Text>
            </Box>
            <Box>
              <Heading as="h3" size="md">Option 2: Upwork Payment</Heading>
              <Text>Bruto Income: ${formatNumber(results.brutoIncome)}</Text>
              <Text>Upwork Fee: ${formatNumber(results.upwork.fee)} (10%)</Text>
              <Text>Transaction Fee: ${formatNumber(results.upwork.transactionFee)} (fixed)</Text>
              <Text>Potential Income: ~{formatNumber(results.upwork.potentialIncome)} RSD</Text>
              <Text>Date Requested: {results.dateRequested}</Text>
              <Text>Date Estimation to Arrive: {results.upwork.dateEstimation}</Text>
            </Box>
          </Box>
        )}
      </Container>
    </ChakraProvider>
  );
};

export default App;
